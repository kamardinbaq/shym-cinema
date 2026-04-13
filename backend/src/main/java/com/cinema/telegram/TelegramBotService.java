package com.cinema.telegram;

import com.cinema.entity.Reservation;
import com.cinema.service.impl.AdminService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Telegram bot that verifies Kaspi payment receipts (PDF) and auto-confirms reservations.
 *
 * Flow:
 *  1. User sends message with reservation ID + the Kaspi receipt PDF file
 *  2. Bot downloads the PDF and extracts text with PDFBox (no external API needed)
 *  3. Bot checks: seller IIN matches Dark Cinema, amount == session price
 *  4. Bot checks: this receipt number has never been used before
 *  5. Bot confirms the reservation atomically with the receipt number
 *
 * Enabled by setting TELEGRAM_BOT_TOKEN env variable.
 */
@Service
public class TelegramBotService {

    private static final Logger log = LoggerFactory.getLogger(TelegramBotService.class);

    private static final int LONG_POLL_TIMEOUT_SEC = 30;
    // Matches an 8-char alphanumeric confirmation code (e.g. "ABC12345")
    private static final Pattern CODE_PATTERN = Pattern.compile("\\b([A-Z0-9]{6,10})\\b");

    // Kaspi receipt field patterns
    private static final Pattern RECEIPT_NUMBER_PATTERN =
            Pattern.compile("№\\s*чека\\s+(\\S+)", Pattern.CASE_INSENSITIVE);
    private static final Pattern SELLER_IIN_PATTERN =
            Pattern.compile("ИИН/БИН\\s*продавца\\s+(\\d{12})", Pattern.CASE_INSENSITIVE);
    // Amount right after "Платеж успешно совершен" on next non-empty line
    private static final Pattern AMOUNT_PATTERN =
            Pattern.compile("совершен[\\s\\S]{0,20}?(\\d[\\d\\s]*)[₸тТ]", Pattern.CASE_INSENSITIVE);
    // Fallback: any standalone amount line like "3 500 ₸" or "3500 ₸"
    private static final Pattern AMOUNT_FALLBACK =
            Pattern.compile("^(\\d[\\d\\s]{0,8})\\s*[₸тТ]\\s*$", Pattern.MULTILINE);

    private final AdminService adminService;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;
    private final TelegramBotProperties props;

    @Value("${app.session-price:3500}")
    private int sessionPrice;

    @Value("${app.kaspi-seller-iin:990811301225}")
    private String kaspiSellerIin;

    // chatId → reservation waiting for PDF (code was sent first — normal flow)
    private final Map<Long, PendingPayment> pendingPayments = new ConcurrentHashMap<>();
    // chatId → PDF file_id waiting for code (PDF was sent first — reversed flow)
    private final Map<Long, PendingPdf>     pendingPdfs     = new ConcurrentHashMap<>();
    private static final long PENDING_EXPIRY_MS = 15 * 60 * 1000L;

    private String apiUrl;
    private volatile long lastUpdateId = 0;

    public TelegramBotService(AdminService adminService, ObjectMapper objectMapper,
                              TelegramBotProperties props) {
        this.adminService = adminService;
        this.objectMapper = objectMapper;
        this.props = props;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);
        factory.setReadTimeout((LONG_POLL_TIMEOUT_SEC + 5) * 1000);
        this.restTemplate = new RestTemplate(factory);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void startBot() {
        String token = props.getToken();
        if (token == null || token.isBlank()) {
            log.info("[TelegramBot] TELEGRAM_BOT_TOKEN not set — bot disabled.");
            return;
        }
        this.apiUrl = "https://api.telegram.org/bot" + token;

        Thread thread = new Thread(this::longPollLoop, "telegram-poll");
        thread.setDaemon(true);
        thread.start();
        log.info("[TelegramBot] Long-polling started. PDF receipt verification active.");
    }

    // ── Long-polling loop ─────────────────────────────────────────────────────

    private void longPollLoop() {
        while (!Thread.currentThread().isInterrupted()) {
            try {
                pollOnce();
            } catch (Exception e) {
                log.warn("[TelegramBot] Poll error: {} — retrying in 5 s", e.getMessage());
                sleep(5_000);
            }
        }
    }

    private void pollOnce() throws Exception {
        String url = apiUrl + "/getUpdates?offset=" + (lastUpdateId + 1)
                + "&timeout=" + LONG_POLL_TIMEOUT_SEC;
        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) return;

        JsonNode root = objectMapper.readTree(response.getBody());
        if (!root.path("ok").asBoolean()) return;

        for (JsonNode update : root.path("result")) {
            long id = update.path("update_id").asLong();
            if (id > lastUpdateId) lastUpdateId = id;
            if (update.has("message")) handleMessage(update.get("message"));
        }
    }

    // ── Message handler ───────────────────────────────────────────────────────

    private void handleMessage(JsonNode message) {
        long chatId = message.path("chat").path("id").asLong();
        String text = message.has("text") ? message.path("text").asText("").trim() : "";

        boolean hasDocument = message.has("document");
        String mimeType = hasDocument ? message.path("document").path("mime_type").asText("") : "";
        boolean isPdf = "application/pdf".equals(mimeType);

        // ── /start ────────────────────────────────────────────────────────────
        if ("/start".equalsIgnoreCase(text)) {
            sendMessage(chatId,
                    "👻 *Добро пожаловать в Dark Cinema!*\n\n" +
                    "Для подтверждения оплаты:\n\n" +
                    "*Шаг 1.* Напишите сюда *код подтверждения брони* — 8 символов с сайта (например: `ABC12345`)\n\n" +
                    "*Шаг 2.* Откройте приложение Kaspi → найдите оплату Dark Cinema → нажмите *«Поделиться»* → выберите этого бота\n\n" +
                    "✅ Бот проверит чек и подтвердит бронь автоматически!");
            return;
        }

        // ── PDF received ──────────────────────────────────────────────────────
        if (isPdf) {
            String fileId = message.path("document").path("file_id").asText(null);
            if (fileId == null) {
                sendMessage(chatId, "❌ Не удалось получить файл. Попробуйте ещё раз.");
                return;
            }

            PendingPayment pending = pendingPayments.get(chatId);
            boolean paymentExpired = pending != null &&
                    System.currentTimeMillis() - pending.timestamp() > PENDING_EXPIRY_MS;
            if (paymentExpired) {
                pendingPayments.remove(chatId);
                pending = null;
            }

            if (pending != null) {
                // Normal flow: code was sent first — process immediately
                processReceipt(chatId, pending.reservationId(), fileId);
            } else {
                // Reversed flow: PDF arrived before the code — store it and ask for code
                pendingPdfs.put(chatId, new PendingPdf(fileId, System.currentTimeMillis()));
                sendMessage(chatId,
                        "📄 Чек получен и сохранён!\n\n" +
                        "Теперь отправьте *код подтверждения брони* (8 символов с сайта).\n" +
                        "Бот проверит чек автоматически.");
            }
            return;
        }

        // ── Non-PDF document ──────────────────────────────────────────────────
        if (hasDocument) {
            sendMessage(chatId,
                    "⚠️ Нужен *PDF-файл* фискального чека из приложения Kaspi.\n\n" +
                    "В Kaspi: найдите оплату Dark Cinema → нажмите *«Поделиться»* → выберите этого бота.");
            return;
        }

        // ── Confirmation code received ────────────────────────────────────────
        String code = extractCode(text);
        if (code != null) {
            Optional<Reservation> reservationOpt;
            try {
                reservationOpt = adminService.findPendingReservationByCode(code);
            } catch (Exception e) {
                log.error("[TelegramBot] DB error looking up code {}: {}", code, e.getMessage());
                sendMessage(chatId, "❌ Ошибка сервера. Попробуйте ещё раз.");
                return;
            }

            if (reservationOpt.isEmpty()) {
                sendMessage(chatId,
                        "❌ Бронирование с кодом *" + code + "* не найдено.\n\n" +
                        "Возможные причины:\n" +
                        "• Код введён неверно — проверьте на сайте\n" +
                        "• Бронь уже подтверждена или отменена\n" +
                        "• Время ожидания истекло\n\n" +
                        "Попробуйте ещё раз через 10 секунд.");
                return;
            }

            long reservationId = reservationOpt.get().getId();

            // Check if PDF was already sent before the code (reversed flow)
            PendingPdf pendingPdf = pendingPdfs.get(chatId);
            boolean pdfExpired = pendingPdf != null &&
                    System.currentTimeMillis() - pendingPdf.timestamp() > PENDING_EXPIRY_MS;
            if (pdfExpired) {
                pendingPdfs.remove(chatId);
                pendingPdf = null;
            }

            if (pendingPdf != null) {
                // PDF was already sent — process immediately without asking again.
                // Register in pendingPayments FIRST so that if the PDF fails validation,
                // the session stays active and the user can re-send a correct PDF.
                pendingPdfs.remove(chatId);
                pendingPayments.put(chatId, new PendingPayment(reservationId, System.currentTimeMillis()));
                sendMessage(chatId, "✅ Код *" + code + "* принят! Проверяю сохранённый чек...");
                processReceipt(chatId, reservationId, pendingPdf.fileId());
            } else {
                // Normal flow — store the reservation and wait for PDF
                pendingPayments.put(chatId, new PendingPayment(reservationId, System.currentTimeMillis()));
                sendMessage(chatId,
                        "✅ Код *" + code + "* принят!\n\n" +
                        "Теперь откройте приложение *Kaspi* →\n" +
                        "найдите оплату Dark Cinema → нажмите *«Поделиться»* →\n" +
                        "выберите этого бота.\n\n" +
                        "_У вас есть 15 минут для отправки чека._");
            }
            return;
        }

        // ── Unknown message ───────────────────────────────────────────────────
        if (!text.isEmpty()) {
            sendMessage(chatId,
                    "Напишите /start чтобы увидеть инструкцию.\n\n" +
                    "Или сразу отправьте *код подтверждения брони* (8 символов с сайта, например: `ABC12345`).");
        }
    }

    // ── Receipt processing (shared by both flows) ─────────────────────────────

    private void processReceipt(long chatId, long reservationId, String fileId) {
        sendMessage(chatId, "⏳ Проверяю чек для бронирования *#" + reservationId + "*...");

        ReceiptData receipt;
        try {
            receipt = extractReceiptFromPdf(fileId);
        } catch (Exception e) {
            log.warn("[TelegramBot] PDF extraction failed: {}", e.getMessage());
            sendMessage(chatId,
                    "⚠️ Не удалось прочитать PDF.\n\n" +
                    "Убедитесь, что делитесь *фискальным чеком* из Kaspi (не скриншотом).");
            return;
        }

        if (receipt == null || receipt.receiptNumber() == null) {
            sendMessage(chatId,
                    "⚠️ Не удалось распознать данные чека.\n\n" +
                    "Поделитесь именно *фискальным чеком* из Kaspi. В нём должны быть поля: *№ чека*, *ИИН/БИН продавца*, сумма.");
            return;
        }

        // Проверка продавца
        if (!kaspiSellerIin.equals(receipt.sellerIin())) {
            log.warn("[TelegramBot] Wrong seller IIN: expected={} got={}", kaspiSellerIin, receipt.sellerIin());
            sendMessage(chatId,
                    "❌ Чек не принадлежит *Dark Cinema*.\n\n" +
                    "Убедитесь, что оплатили по нашему QR-коду Kaspi.\n" +
                    "ИИН продавца должен быть: `" + kaspiSellerIin + "`\n" +
                    "В вашем чеке: `" + (receipt.sellerIin() != null ? receipt.sellerIin() : "не найден") + "`");
            return;
        }

        // Проверка суммы
        long paidAmount = Math.round(receipt.amount());
        if (paidAmount != sessionPrice) {
            sendMessage(chatId,
                    "❌ Сумма в чеке (*" + paidAmount + " ₸*) не совпадает с суммой бронирования (*" + sessionPrice + " ₸*).\n\n" +
                    "Поделитесь чеком с правильной суммой.");
            return;
        }

        // Подтверждение брони
        try {
            adminService.confirmReservationWithReceipt(reservationId, receipt.receiptNumber());
            pendingPayments.remove(chatId);
            sendMessage(chatId,
                    "✅ *Бронирование #" + reservationId + " подтверждено!*\n\n" +
                    "Чек: `" + receipt.receiptNumber() + "`\n" +
                    "Сумма: " + paidAmount + " ₸\n\n" +
                    "Ждём вас в Dark Cinema! 🎬👻");
            log.info("[TelegramBot] Reservation {} confirmed. Receipt={}", reservationId, receipt.receiptNumber());

        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
            if (msg.contains("receipt already used")) {
                sendMessage(chatId,
                        "❌ Этот чек (`" + receipt.receiptNumber() + "`) уже использован для другого бронирования.\n" +
                        "Каждый чек можно использовать только один раз.");
            } else if (msg.contains("already confirmed")) {
                pendingPayments.remove(chatId);
                sendMessage(chatId, "ℹ️ Бронирование *#" + reservationId + "* уже подтверждено. До встречи! 🎬");
            } else if (msg.contains("not found")) {
                sendMessage(chatId, "❌ Бронирование *#" + reservationId + "* не найдено. Проверьте ID на сайте.");
            } else if (msg.contains("cancelled")) {
                pendingPayments.remove(chatId);
                sendMessage(chatId, "❌ Бронирование *#" + reservationId + "* отменено. Создайте новое на сайте.");
            } else {
                sendMessage(chatId, "❌ Ошибка при подтверждении. Обратитесь к администратору.");
                log.error("[TelegramBot] Confirm error for reservation {}: {}", reservationId, e.getMessage());
            }
        }
    }

    // ── PDF parsing ───────────────────────────────────────────────────────────

    /**
     * Downloads the PDF from Telegram and extracts receipt data using PDFBox.
     * No external API call — 100% local parsing.
     */
    private ReceiptData extractReceiptFromPdf(String fileId) throws Exception {
        // 1. Get Telegram file path
        String getFileUrl = apiUrl + "/getFile?file_id=" + fileId;
        ResponseEntity<String> fileResp = restTemplate.getForEntity(getFileUrl, String.class);
        JsonNode fileRoot = objectMapper.readTree(fileResp.getBody());
        String filePath = fileRoot.path("result").path("file_path").asText();
        if (filePath.isBlank()) throw new RuntimeException("Empty file_path from Telegram");

        // 2. Download PDF bytes
        String downloadUrl = "https://api.telegram.org/file/bot" + props.getToken() + "/" + filePath;
        ResponseEntity<byte[]> pdfResp = restTemplate.getForEntity(downloadUrl, byte[].class);
        byte[] pdfBytes = pdfResp.getBody();
        if (pdfBytes == null || pdfBytes.length == 0) throw new RuntimeException("Empty PDF downloaded");

        // 3. Validate size before parsing (prevent OOM with malicious large PDFs)
        final int MAX_PDF_BYTES = 5 * 1024 * 1024; // 5 MB
        if (pdfBytes.length > MAX_PDF_BYTES) {
            throw new RuntimeException("PDF too large: " + pdfBytes.length + " bytes (max 5 MB)");
        }

        // 4. Extract text with PDFBox
        String text;
        try (PDDocument doc = Loader.loadPDF(pdfBytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            text = stripper.getText(doc);
        }
        log.debug("[TelegramBot] PDF text extracted ({} chars)", text.length());

        // 5. Parse fields
        String receiptNumber = findGroup(RECEIPT_NUMBER_PATTERN, text);
        String sellerIin     = findGroup(SELLER_IIN_PATTERN, text);
        double amount        = parseAmount(text);

        log.info("[TelegramBot] Parsed PDF — receipt={}, sellerIin={}, amount={}", receiptNumber, sellerIin, amount);
        return new ReceiptData(receiptNumber, amount, sellerIin);
    }

    /** Returns the first capturing group of the pattern, or null if not found. */
    private String findGroup(Pattern pattern, String text) {
        Matcher m = pattern.matcher(text);
        return m.find() ? m.group(1).trim() : null;
    }

    /**
     * Extracts the payment amount from the PDF text.
     * Tries two strategies: after "совершен" keyword, then any standalone amount line.
     */
    private double parseAmount(String text) {
        // Strategy 1: amount right after "Платеж успешно совершен"
        Matcher m1 = AMOUNT_PATTERN.matcher(text);
        if (m1.find()) {
            String raw = m1.group(1).replaceAll("\\s", "");
            try { return Double.parseDouble(raw); } catch (NumberFormatException ignored) {}
        }
        // Strategy 2: first standalone amount line (e.g. "3 500 ₸" or "3500 ₸")
        Matcher m2 = AMOUNT_FALLBACK.matcher(text);
        while (m2.find()) {
            String raw = m2.group(1).replaceAll("\\s", "");
            try {
                double v = Double.parseDouble(raw);
                if (v > 0) return v;
            } catch (NumberFormatException ignored) {}
        }
        return -1;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String extractCode(String text) {
        if (text == null || text.isBlank()) return null;
        String cleaned = text.replaceAll("(?i)(бронирование|бронь|заказ|номер|код|id|#|№)", "")
                             .trim().toUpperCase();
        Matcher m = CODE_PATTERN.matcher(cleaned);
        return m.find() ? m.group(1) : null;
    }

    private void sendMessage(long chatId, String text) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("chat_id", chatId);
            body.put("text", text);
            body.put("parse_mode", "Markdown");
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            restTemplate.postForEntity(apiUrl + "/sendMessage",
                    new HttpEntity<>(body, headers), String.class);
        } catch (Exception e) {
            log.warn("[TelegramBot] Failed to send message to chat {}: {}", chatId, e.getMessage());
        }
    }

    private void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }

    private record ReceiptData(String receiptNumber, double amount, String sellerIin) {}
    private record PendingPayment(long reservationId, long timestamp) {}
    private record PendingPdf(String fileId, long timestamp) {}
}
