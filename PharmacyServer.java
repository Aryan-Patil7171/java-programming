import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.*;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.DateTimeException;
import java.time.LocalDate;
import java.util.*;

public class PharmacyServer {


    // ============================================================
    // TEAM MEMBER 1 - MEDICINE INVENTORY & DATA STRUCTURES
    // Medicine model, Array, HashMap, TreeMap, initialization and sample inventory.
    // ============================================================


    public static synchronized List<Medicine> getMedicinesForGui() {
        initialize();
        return new ArrayList<>(medicinesSorted.values());
    }

    // ---------------------------------------------------------
    // SAMPLE INVENTORY
    // ---------------------------------------------------------

    private static void seedInventory() {
        addSeed("M101", "Paracetamol 500mg", "Pain Relief", 25.00, 80, "2028-06-30");
        addSeed("M102", "Amoxicillin 250mg", "Antibiotic", 120.00, 35, "2027-12-15");
        addSeed("M103", "Cetirizine 10mg", "Allergy", 45.00, 50, "2028-03-20");
        addSeed("M104", "Vitamin C Tablets", "Supplements", 180.00, 20, "2027-09-10");
        addSeed("M105", "Cough Syrup", "Cold & Cough", 95.00, 12, "2027-05-31");
    }

    private static void addSeed(
            String id,
            String name,
            String category,
            double price,
            int stock,
            String expiry
    ) {
        if (medicineCount >= MAX_MEDICINES) {
            return;
        }

        Medicine medicine = new Medicine(
                id,
                name,
                category,
                price,
                stock,
                LocalDate.parse(expiry)
        );

        medicineArray[medicineCount++] = medicine;
        medicineById.put(id, medicine);

        medicinesSorted.put(
                name.toLowerCase() + "|" + id,
                medicine
        );
    }

    // ---------------------------------------------------------
    // MEDICINE CLASS
    // ---------------------------------------------------------

    public static class Medicine {
        public String id;
        public String name;
        public String category;
        public double price;
        public int stock;
        public LocalDate expiry;

        Medicine(
                String id,
                String name,
                String category,
                double price,
                int stock,
                LocalDate expiry
        ) {
            this.id = id;
            this.name = name;
            this.category = category;
            this.price = price;
            this.stock = stock;
            this.expiry = expiry;
        }

        String status() {
            if (expiry.isBefore(LocalDate.now())) {
                return "EXPIRED";
            }

            if (stock <= 5) {
                return "LOW STOCK";
            }

            return "Available";
        }

        String toJson() {
            return "{"
                    + "\"id\":\"" + jsonEscape(id) + "\","
                    + "\"name\":\"" + jsonEscape(name) + "\","
                    + "\"category\":\"" + jsonEscape(category) + "\","
                    + "\"price\":" + price + ","
                    + "\"stock\":" + stock + ","
                    + "\"expiry\":\"" + expiry + "\","
                    + "\"status\":\"" + status() + "\""
                    + "}";
        }
    }

    // ============================================================
    // TEAM MEMBER 2 - SEARCH & STOCK MANAGEMENT
    // Medicine search, add medicine, stock updates and related API handlers.
    // ============================================================


    public static synchronized List<Medicine> searchMedicinesForGui(String query) {
        initialize();
        String q = query == null ? "" : query.trim();
        if (q.isEmpty()) return getMedicinesForGui();
        ArrayList<Medicine> results = new ArrayList<>();
        Medicine exact = medicineById.get(q.toUpperCase());
        if (exact != null) { results.add(exact); return results; }
        String lower = q.toLowerCase();
        for (Medicine medicine : medicinesSorted.values()) {
            if (medicine.name.toLowerCase().contains(lower) || medicine.category.toLowerCase().contains(lower)) results.add(medicine);
        }
        return results;
    }

    public static synchronized void updateStockForGui(String id, int adjustment) {
        initialize();
        Medicine medicine = medicineById.get(id == null ? "" : id.trim().toUpperCase());
        if (medicine == null) throw new IllegalArgumentException("Medicine not found.");
        if (medicine.stock + adjustment < 0) throw new IllegalArgumentException("Stock cannot go below zero.");
        medicine.stock += adjustment;
    }

    public static synchronized void addMedicineForGui(String id, String name, String category, double price, int stock, LocalDate expiry) {
        initialize();
        id = id.trim().toUpperCase();
        if (id.isEmpty() || name == null || name.trim().isEmpty() || category == null || category.trim().isEmpty()) throw new IllegalArgumentException("All medicine fields are required.");
        if (medicineById.containsKey(id)) throw new IllegalArgumentException("Medicine ID already exists.");
        if (price < 0 || stock < 0) throw new IllegalArgumentException("Price and stock cannot be negative.");
        if (medicineCount >= MAX_MEDICINES) throw new IllegalArgumentException("Inventory capacity is full.");
        Medicine medicine = new Medicine(id, name.trim(), category.trim(), price, stock, expiry);
        medicineArray[medicineCount++] = medicine;
        medicineById.put(id, medicine);
        medicinesSorted.put(medicine.name.toLowerCase() + "|" + id, medicine);
    }

    // ---------------------------------------------------------
    // API: SEARCH
    // ---------------------------------------------------------

    private static void handleSearch(HttpExchange exchange) throws IOException {
        if (!exchange.getRequestMethod().equalsIgnoreCase("GET")) {
            send(exchange, 405, "application/json", "{\"error\":\"Method not allowed\"}");
            return;
        }

        Map<String, String> params = queryParams(exchange.getRequestURI().getRawQuery());
        String query = params.getOrDefault("q", "").trim();

        if (query.isEmpty()) {
            send(exchange, 200, "application/json", "[]");
            return;
        }

        ArrayList<Medicine> results = new ArrayList<>();

        // HashMap gives direct ID-based searching
        Medicine exact = medicineById.get(query.toUpperCase());

        if (exact != null) {
            results.add(exact);
        } else {
            // TreeMap values are already sorted
            String lower = query.toLowerCase();

            for (Medicine medicine : medicinesSorted.values()) {
                if (medicine.name.toLowerCase().contains(lower)) {
                    results.add(medicine);
                }
            }
        }

        StringBuilder json = new StringBuilder("[");
        for (int i = 0; i < results.size(); i++) {
            if (i > 0) json.append(",");
            json.append(results.get(i).toJson());
        }
        json.append("]");

        send(exchange, 200, "application/json", json.toString());
    }

    // ---------------------------------------------------------
    // API: ADD MEDICINE
    // ---------------------------------------------------------

    private static void handleAddMedicine(HttpExchange exchange) throws IOException {
        if (!exchange.getRequestMethod().equalsIgnoreCase("POST")) {
            send(exchange, 405, "application/json", "{\"error\":\"Method not allowed\"}");
            return;
        }
        Map<String, String> data = formData(exchange);
        String id = data.getOrDefault("id", "").trim().toUpperCase();
        String name = data.getOrDefault("name", "").trim();
        String category = data.getOrDefault("category", "").trim();
        String priceText = data.getOrDefault("price", "").trim();
        String stockText = data.getOrDefault("stock", "").trim();
        String expiryText = data.getOrDefault("expiry", "").trim();

        if (id.isEmpty() || name.isEmpty() || category.isEmpty() || priceText.isEmpty() || stockText.isEmpty() || expiryText.isEmpty()) {
            send(exchange, 400, "application/json", error("All medicine fields are required."));
            return;
        }
        if (medicineById.containsKey(id)) {
            send(exchange, 409, "application/json", error("Medicine ID already exists."));
            return;
        }
        try {
            double price = Double.parseDouble(priceText);
            int stock = Integer.parseInt(stockText);
            LocalDate expiry = LocalDate.parse(expiryText);
            if (price < 0 || stock < 0) throw new IllegalArgumentException("Price and stock cannot be negative.");
            if (medicineCount >= MAX_MEDICINES) throw new IllegalArgumentException("Inventory capacity is full.");
            Medicine medicine = new Medicine(id, name, category, price, stock, expiry);
            medicineArray[medicineCount++] = medicine;
            medicineById.put(id, medicine);
            medicinesSorted.put(name.toLowerCase() + "|" + id, medicine);
            System.out.println("[MEDICINE] Added " + name + " (" + id + ")");
            send(exchange, 200, "application/json", "{\"message\":\"Medicine added successfully\",\"name\":\"" + jsonEscape(name) + "\"}");
        } catch (DateTimeException | NumberFormatException e) {
            send(exchange, 400, "application/json", error("Enter valid price, stock and expiry date."));
        } catch (IllegalArgumentException e) {
            send(exchange, 400, "application/json", error(e.getMessage()));
        }
    }

    // ---------------------------------------------------------
    // API: STOCK
    // ---------------------------------------------------------

    private static void handleStock(HttpExchange exchange) throws IOException {
        if (!exchange.getRequestMethod().equalsIgnoreCase("POST")) {
            send(exchange, 405, "application/json", "{\"error\":\"Method not allowed\"}");
            return;
        }

        Map<String, String> data = formData(exchange);

        String id = data.getOrDefault("id", "").trim().toUpperCase();
        String adjustmentText = data.getOrDefault("adjustment", "0");

        Medicine medicine = medicineById.get(id);

        if (medicine == null) {
            send(exchange, 404, "application/json", error("Medicine not found."));
            return;
        }

        try {
            int adjustment = Integer.parseInt(adjustmentText);

            if (medicine.stock + adjustment < 0) {
                send(exchange, 400, "application/json",
                        error("Stock cannot go below zero."));
                return;
            }

            medicine.stock += adjustment;

            System.out.println(
                    "[STOCK] " + medicine.name +
                    " -> " + medicine.stock
            );

            send(exchange, 200, "application/json",
                    "{\"message\":\"Stock updated successfully\"}");

        } catch (NumberFormatException e) {
            send(exchange, 400, "application/json",
                    error("Invalid stock adjustment."));
        }
    }

    // ============================================================
    // TEAM MEMBER 3 - CUSTOMER, BILLING & SALES
    // Customer purchases, CartItem, Billing and LinkedList sales records.
    // ============================================================


    public static synchronized Billing processSaleForGui(String customerName, String phone, String medicineId, int quantity) {
        initialize();
        customerName = customerName == null ? "" : customerName.trim();
        medicineId = medicineId == null ? "" : medicineId.trim().toUpperCase();
        if (customerName.isEmpty()) throw new IllegalArgumentException("Customer name is required.");
        Medicine medicine = medicineById.get(medicineId);
        if (medicine == null) throw new IllegalArgumentException("Medicine ID not found.");
        if (quantity <= 0) throw new IllegalArgumentException("Quantity must be greater than zero.");
        if (quantity > medicine.stock) throw new IllegalArgumentException("Insufficient stock. Available: " + medicine.stock);
        Customer customer = new Customer(customerName, phone == null ? "" : phone.trim());
        ArrayList<CartItem> items = new ArrayList<>();
        items.add(new CartItem(medicine, quantity));
        medicine.stock -= quantity;
        String billNumber = String.format("BILL-%04d", salesRecords.size() + 1);
        Billing billing = new Billing(billNumber, LocalDate.now(), customer, items);
        salesRecords.add(billing);
        return billing;
    }

    public static synchronized List<Billing> getSalesForGui() {
        initialize();
        return new ArrayList<>(salesRecords);
    }

    // ---------------------------------------------------------
    // API: SALE
    // ---------------------------------------------------------

    private static void handleSale(HttpExchange exchange) throws IOException {
        if (!exchange.getRequestMethod().equalsIgnoreCase("POST")) {
            send(exchange, 405, "application/json", "{\"error\":\"Method not allowed\"}");
            return;
        }

        Map<String, String> data = formData(exchange);

        String customerName = data.getOrDefault("customerName", "").trim();
        String phone = data.getOrDefault("phone", "").trim();
        String medicineId = data.getOrDefault("medicineId", "").trim().toUpperCase();
        String quantityText = data.getOrDefault("quantity", "0");

        if (customerName.isEmpty()) {
            send(exchange, 400, "application/json",
                    error("Customer name is required."));
            return;
        }

        Medicine medicine = medicineById.get(medicineId);

        if (medicine == null) {
            send(exchange, 404, "application/json",
                    error("Medicine ID not found."));
            return;
        }

        try {
            int quantity = Integer.parseInt(quantityText);

            if (quantity <= 0) {
                send(exchange, 400, "application/json",
                        error("Quantity must be greater than zero."));
                return;
            }

            if (quantity > medicine.stock) {
                send(exchange, 400, "application/json",
                        error("Insufficient stock. Available: " + medicine.stock));
                return;
            }

            Customer customer = new Customer(customerName, phone);

            ArrayList<CartItem> items = new ArrayList<>();
            items.add(new CartItem(medicine, quantity));

            medicine.stock -= quantity;

            String billNumber = String.format(
                    "BILL-%04d",
                    salesRecords.size() + 1
            );

            Billing billing = new Billing(
                    billNumber,
                    LocalDate.now(),
                    customer,
                    items
            );

            // LinkedList stores completed sales
            salesRecords.add(billing);

            System.out.println(
                    "[SALE] " + billNumber +
                    " | " + customerName +
                    " | " + medicine.name +
                    " x " + quantity +
                    " | ₹" + String.format("%.2f", billing.total())
            );

            send(exchange, 200, "application/json",
                    billing.toJson());

        } catch (NumberFormatException e) {
            send(exchange, 400, "application/json",
                    error("Invalid quantity."));
        }
    }

    // ---------------------------------------------------------
    // API: SALES
    // ---------------------------------------------------------

    private static void handleSales(HttpExchange exchange) throws IOException {
        if (!exchange.getRequestMethod().equalsIgnoreCase("GET")) {
            send(exchange, 405, "application/json", "{\"error\":\"Method not allowed\"}");
            return;
        }

        StringBuilder json = new StringBuilder("[");
        boolean first = true;

        for (Billing billing : salesRecords) {
            if (!first) json.append(",");
            json.append(billing.toJson());
            first = false;
        }

        json.append("]");

        send(exchange, 200, "application/json", json.toString());
    }

    // ---------------------------------------------------------
    // CUSTOMER CLASS
    // ---------------------------------------------------------

    public static class Customer {
        public String name;
        public String phone;

        Customer(String name, String phone) {
            this.name = name;
            this.phone = phone;
        }
    }

    // ---------------------------------------------------------
    // CART ITEM CLASS
    // ---------------------------------------------------------

    public static class CartItem {
        public Medicine medicine;
        public int quantity;

        CartItem(Medicine medicine, int quantity) {
            this.medicine = medicine;
            this.quantity = quantity;
        }

        double amount() {
            return medicine.price * quantity;
        }
    }

    // ---------------------------------------------------------
    // BILLING CLASS
    // ---------------------------------------------------------

    public static class Billing {
        public String billNumber;
        public LocalDate date;
        public Customer customer;
        public ArrayList<CartItem> items;

        Billing(
                String billNumber,
                LocalDate date,
                Customer customer,
                ArrayList<CartItem> items
        ) {
            this.billNumber = billNumber;
            this.date = date;
            this.customer = customer;
            this.items = items;
        }

        double total() {
            return items.stream()
                    .mapToDouble(CartItem::amount)
                    .sum();
        }

        String toJson() {
            StringBuilder itemJson = new StringBuilder("[");

            for (int i = 0; i < items.size(); i++) {
                if (i > 0) itemJson.append(",");

                CartItem item = items.get(i);

                itemJson.append("{")
                        .append("\"id\":\"")
                        .append(jsonEscape(item.medicine.id))
                        .append("\",")
                        .append("\"name\":\"")
                        .append(jsonEscape(item.medicine.name))
                        .append("\",")
                        .append("\"quantity\":")
                        .append(item.quantity)
                        .append(",")
                        .append("\"amount\":")
                        .append(item.amount())
                        .append("}");
            }

            itemJson.append("]");

            return "{"
                    + "\"billNumber\":\"" + billNumber + "\","
                    + "\"date\":\"" + date + "\","
                    + "\"customerName\":\""
                    + jsonEscape(customer.name) + "\","
                    + "\"phone\":\""
                    + jsonEscape(customer.phone) + "\","
                    + "\"items\":" + itemJson + ","
                    + "\"total\":" + total()
                    + "}";
        }
    }

    // ============================================================
    // TEAM MEMBER 4 - SERVER, GUI INTEGRATION & HELPERS
    // HTTP server, API routing, frontend serving, request parsing and response helpers.
    // ============================================================


    private static final int PORT = 8080;
    private static final int MAX_MEDICINES = 100;

    // PS requirements:
    // Array      -> medicineArray
    // HashMap    -> medicineById
    // TreeMap    -> medicinesSorted
    // LinkedList -> salesRecords

    private static final Medicine[] medicineArray = new Medicine[MAX_MEDICINES];
    private static final HashMap<String, Medicine> medicineById = new HashMap<>();
    private static final TreeMap<String, Medicine> medicinesSorted = new TreeMap<>();
    private static final LinkedList<Billing> salesRecords = new LinkedList<>();

    private static int medicineCount = 0;
    private static boolean initialized = false;

    public static synchronized void initialize() {
        if (initialized) return;
        seedInventory();
        initialized = true;
    }

    public static void main(String[] args) throws Exception {
        initialize();

        HttpServer server = HttpServer.create(
                new InetSocketAddress(PORT),
                0
        );

        server.createContext("/", PharmacyServer::serveFrontend);
        server.createContext("/api/medicines", PharmacyServer::handleMedicines);
        server.createContext("/api/search", PharmacyServer::handleSearch);
        server.createContext("/api/stock", PharmacyServer::handleStock);
        server.createContext("/api/medicine", PharmacyServer::handleAddMedicine);
        server.createContext("/api/sale", PharmacyServer::handleSale);
        server.createContext("/api/sales", PharmacyServer::handleSales);

        server.setExecutor(null);
        server.start();

        System.out.println("==========================================");
        System.out.println(" PHARMACY MANAGEMENT SYSTEM");
        System.out.println("==========================================");
        System.out.println("Server started at:");
        System.out.println("http://localhost:" + PORT);
        System.out.println();
        System.out.println("Open the URL in your browser.");
        System.out.println("Press Ctrl + C to stop the server.");
        System.out.println("==========================================");
    }

    // ---------------------------------------------------------
    // FRONTEND
    // ---------------------------------------------------------

    private static void serveFrontend(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();

        if (path.equals("/")) {
            path = "/index.html";
        }

        String fileName = path.substring(1);

        Path file = Path.of("web", fileName);

        if (!Files.exists(file) || Files.isDirectory(file)) {
            send(exchange, 404, "text/plain", "File not found.");
            return;
        }

        String contentType = getContentType(fileName);
        byte[] data = Files.readAllBytes(file);

        exchange.getResponseHeaders().set(
                "Content-Type",
                contentType + "; charset=UTF-8"
        );

        exchange.sendResponseHeaders(200, data.length);

        try (OutputStream output = exchange.getResponseBody()) {
            output.write(data);
        }
    }

    private static String getContentType(String fileName) {
        if (fileName.endsWith(".html")) return "text/html";
        if (fileName.endsWith(".css")) return "text/css";
        if (fileName.endsWith(".js")) return "application/javascript";
        return "text/plain";
    }

    // ---------------------------------------------------------
    // API: MEDICINES
    // ---------------------------------------------------------

    private static void handleMedicines(HttpExchange exchange) throws IOException {
        if (!exchange.getRequestMethod().equalsIgnoreCase("GET")) {
            send(exchange, 405, "application/json", "{\"error\":\"Method not allowed\"}");
            return;
        }

        StringBuilder json = new StringBuilder("[");
        boolean first = true;

        // TreeMap keeps records sorted by medicine name
        for (Medicine medicine : medicinesSorted.values()) {
            if (!first) json.append(",");
            json.append(medicine.toJson());
            first = false;
        }

        json.append("]");

        send(exchange, 200, "application/json", json.toString());
    }

    // ---------------------------------------------------------
    // HELPERS
    // ---------------------------------------------------------

    private static Map<String, String> formData(
            HttpExchange exchange
    ) throws IOException {

        String body = new String(
                exchange.getRequestBody().readAllBytes(),
                StandardCharsets.UTF_8
        );

        return queryParams(body);
    }

    private static Map<String, String> queryParams(String query) {
        Map<String, String> params = new HashMap<>();

        if (query == null || query.isEmpty()) {
            return params;
        }

        for (String pair : query.split("&")) {
            String[] parts = pair.split("=", 2);

            String key = urlDecode(parts[0]);
            String value = parts.length > 1
                    ? urlDecode(parts[1])
                    : "";

            params.put(key, value);
        }

        return params;
    }

    private static String urlDecode(String value) {
        return URLDecoder.decode(
                value,
                StandardCharsets.UTF_8
        );
    }

    private static String error(String message) {
        return "{\"error\":\"" + jsonEscape(message) + "\"}";
    }

    private static void send(
            HttpExchange exchange,
            int status,
            String contentType,
            String response
    ) throws IOException {

        byte[] data = response.getBytes(
                StandardCharsets.UTF_8
        );

        exchange.getResponseHeaders().set(
                "Content-Type",
                contentType + "; charset=UTF-8"
        );

        exchange.sendResponseHeaders(
                status,
                data.length
        );

        try (OutputStream output =
                     exchange.getResponseBody()) {

            output.write(data);
        }
    }

    private static String jsonEscape(String value) {
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"");
    }
}
