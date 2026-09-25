# Team 12 — Pharmacy Inventory and Billing Management System (Java Swing)

This version adds the **required Java Swing GUI** from the Team 12 problem statement. The React/Vite UI can remain as an optional web UI, but the official college GUI is now `PharmacySwingApp.java`.

## Run

From this folder:

```bash
javac PharmacyServer.java PharmacySwingApp.java
java PharmacySwingApp
```

Java 17+ is recommended.

## Problem-statement coverage

- Medicine inventory: `Medicine[] medicineArray`
- Sales records: `LinkedList<Billing> salesRecords`
- Medicine ID search: `HashMap<String, Medicine> medicineById`
- Sorted records: `TreeMap<String, Medicine> medicinesSorted`
- OOP classes: `Medicine`, `Customer`, `CartItem`, `Billing`
- Swing GUI: `PharmacySwingApp`
- Search medicines
- Add medicines
- Update stock
- Process customer sales
- Calculate totals
- Generate bill preview
- View sales records
- Expiry and low-stock status

The Swing application calls the same Java inventory/billing logic in `PharmacyServer.java`, so the required collections are not just displayed in the GUI—they are used by the application logic.
