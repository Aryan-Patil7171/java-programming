import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.table.DefaultTableCellRenderer;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;

/**
 * Team 12 - Pharmacy Inventory and Billing Management System
 * Swing GUI required by the project problem statement.
 */
public class PharmacySwingApp extends JFrame {
    private final Color BG = new Color(8, 16, 28);
    private final Color PANEL = new Color(14, 24, 39);
    private final Color PANEL2 = new Color(18, 31, 49);
    private final Color BORDER = new Color(45, 61, 82);
    private final Color TEXT = new Color(235, 242, 248);
    private final Color MUTED = new Color(151, 166, 184);
    private final Color ACCENT = new Color(35, 197, 170);

    private DefaultTableModel inventoryModel;
    private JTable inventoryTable;
    private JTextField searchField;
    private JComboBox<String> medicineCombo;
    private JTextField customerField, phoneField, quantityField;
    private JTextArea billArea;
    private DefaultTableModel salesModel;
    private JLabel medicineCountLabel, stockValueLabel, salesCountLabel;

    public PharmacySwingApp() {
        PharmacyServer.initialize();
        setTitle("PharmaCare — Team 12");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setMinimumSize(new Dimension(1050, 700));
        setSize(1200, 760);
        setLocationRelativeTo(null);
        buildUI();
        refreshAll();
        showDashboard();
    }

    private void buildUI() {
        JPanel root = new JPanel(new BorderLayout());
        root.setBackground(BG);
        root.add(buildSidebar(), BorderLayout.WEST);
        root.add(buildContent(), BorderLayout.CENTER);
        setContentPane(root);
    }

    private JPanel buildSidebar() {
        JPanel side = new JPanel();
        side.setPreferredSize(new Dimension(220, 0));
        side.setBackground(new Color(6, 13, 23));
        side.setBorder(new EmptyBorder(28, 18, 22, 18));
        side.setLayout(new BoxLayout(side, BoxLayout.Y_AXIS));

        JLabel logo = new JLabel("✚  PharmaCare");
        logo.setForeground(TEXT);
        logo.setFont(new Font("SansSerif", Font.BOLD, 20));
        side.add(logo);
        JLabel team = new JLabel("TEAM 12 • JAVA SWING");
        team.setForeground(ACCENT);
        team.setFont(new Font("SansSerif", Font.BOLD, 10));
        team.setBorder(new EmptyBorder(5, 3, 28, 0));
        side.add(team);

        JLabel nav = new JLabel("PHARMACY OPERATIONS");
        nav.setForeground(MUTED);
        nav.setFont(new Font("SansSerif", Font.BOLD, 10));
        nav.setBorder(new EmptyBorder(0, 3, 12, 0));
        side.add(nav);

        side.add(navButton("▦   Dashboard", () -> showDashboard()));
        side.add(navButton("▤   Inventory", () -> showInventory()));
        side.add(navButton("▣   Billing", () -> showBilling()));
        side.add(navButton("◷   Sales Records", () -> showSales()));
        side.add(Box.createVerticalGlue());

        JLabel req = new JLabel("Java Collections");
        req.setForeground(MUTED);
        req.setFont(new Font("SansSerif", Font.BOLD, 11));
        side.add(req);
        JLabel ds = new JLabel("Array • LinkedList • HashMap • TreeMap");
        ds.setForeground(new Color(110, 128, 149));
        ds.setFont(new Font("SansSerif", Font.PLAIN, 10));
        side.add(ds);
        return side;
    }

    private JButton navButton(String text, Runnable action) {
        JButton b = new JButton(text);
        b.setAlignmentX(Component.LEFT_ALIGNMENT);
        b.setMaximumSize(new Dimension(Integer.MAX_VALUE, 44));
        b.setHorizontalAlignment(SwingConstants.LEFT);
        b.setForeground(TEXT);
        b.setBackground(PANEL);
        b.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(BORDER), new EmptyBorder(0, 12, 0, 8)));
        b.setFocusPainted(false);
        b.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        b.addActionListener(e -> action.run());
        return b;
    }

    private JPanel buildContent() {
        JPanel content = new JPanel(new BorderLayout(0, 18));
        content.setBackground(BG);
        content.setBorder(new EmptyBorder(26, 28, 26, 28));
        JPanel header = new JPanel(new BorderLayout());
        header.setOpaque(false);
        JLabel title = new JLabel("Pharmacy Management System");
        title.setForeground(TEXT);
        title.setFont(new Font("SansSerif", Font.BOLD, 26));
        header.add(title, BorderLayout.WEST);
        JLabel sub = new JLabel("Inventory • Billing • Sales");
        sub.setForeground(MUTED);
        sub.setFont(new Font("SansSerif", Font.PLAIN, 13));
        header.add(sub, BorderLayout.EAST);
        content.add(header, BorderLayout.NORTH);

        JPanel cards = new JPanel(new GridLayout(1, 3, 14, 0));
        cards.setOpaque(false);
        medicineCountLabel = statValue(); stockValueLabel = statValue(); salesCountLabel = statValue();
        cards.add(statCard("MEDICINES", medicineCountLabel));
        cards.add(statCard("TOTAL STOCK", stockValueLabel));
        cards.add(statCard("SALES RECORDS", salesCountLabel));
        content.add(cards, BorderLayout.SOUTH);
        return content;
    }

    private JLabel statValue() {
        JLabel l = new JLabel("0"); l.setForeground(TEXT); l.setFont(new Font("SansSerif", Font.BOLD, 24)); return l;
    }
    private JPanel statCard(String name, JLabel value) {
        JPanel p = new JPanel(new BorderLayout(0, 5)); p.setBackground(PANEL); p.setBorder(BorderFactory.createCompoundBorder(BorderFactory.createLineBorder(BORDER), new EmptyBorder(14,16,14,16)));
        JLabel n = new JLabel(name); n.setForeground(MUTED); n.setFont(new Font("SansSerif", Font.BOLD, 10)); p.add(n, BorderLayout.NORTH); p.add(value, BorderLayout.CENTER); return p;
    }

    private JPanel page(String title, String subtitle) {
        JPanel p = new JPanel(new BorderLayout(0, 14)); p.setBackground(BG); p.setBorder(new EmptyBorder(0, 0, 0, 0));
        JPanel h = new JPanel(new BorderLayout()); h.setOpaque(false);
        JLabel t = new JLabel(title); t.setForeground(TEXT); t.setFont(new Font("SansSerif", Font.BOLD, 22)); h.add(t, BorderLayout.WEST);
        JLabel s = new JLabel(subtitle); s.setForeground(MUTED); s.setFont(new Font("SansSerif", Font.PLAIN, 12)); h.add(s, BorderLayout.SOUTH); p.add(h, BorderLayout.NORTH); return p;
    }

    private void showDashboard() {
        JPanel p = page("Dashboard", "Quick view of your pharmacy operations.");
        JPanel grid = new JPanel(new GridLayout(2, 2, 14, 14)); grid.setOpaque(false);
        grid.add(infoPanel("Inventory", "Search medicines, check expiry and update stock."));
        grid.add(infoPanel("Billing", "Process customer purchases and generate bills."));
        grid.add(infoPanel("Sales", "Completed purchases are maintained in a LinkedList."));
        grid.add(infoPanel("Data Structures", "Array + HashMap + TreeMap + LinkedList are implemented in Java."));
        p.add(grid, BorderLayout.CENTER); setPage(p);
    }

    private JPanel infoPanel(String title, String text) {
        JPanel p = new JPanel(new BorderLayout(0, 8)); p.setBackground(PANEL); p.setBorder(BorderFactory.createCompoundBorder(BorderFactory.createLineBorder(BORDER), new EmptyBorder(18,18,18,18)));
        JLabel t = new JLabel(title); t.setForeground(ACCENT); t.setFont(new Font("SansSerif", Font.BOLD, 16)); p.add(t, BorderLayout.NORTH);
        JTextArea a = new JTextArea(text); a.setEditable(false); a.setLineWrap(true); a.setWrapStyleWord(true); a.setOpaque(false); a.setForeground(MUTED); a.setFont(new Font("SansSerif", Font.PLAIN, 13)); p.add(a, BorderLayout.CENTER); return p;
    }

    private void showInventory() {
        JPanel p = page("Medicine Inventory", "TreeMap-sorted medicine records with HashMap ID search.");
        JPanel top = new JPanel(new BorderLayout(10,0)); top.setOpaque(false);
        searchField = new JTextField(); styleField(searchField); searchField.putClientProperty("JTextField.placeholderText", "Search by medicine ID, name or category...");
        JButton search = actionButton("Search"); search.addActionListener(e -> refreshInventory(PharmacyServer.searchMedicinesForGui(searchField.getText())));
        JButton all = actionButton("Show All"); all.addActionListener(e -> refreshInventory(PharmacyServer.getMedicinesForGui()));
        JButton add = actionButton("+ Add Medicine"); add.addActionListener(e -> addMedicineDialog());
        JButton stock = actionButton("Update Stock"); stock.addActionListener(e -> stockDialog());
        top.add(searchField, BorderLayout.CENTER); JPanel actions = new JPanel(new GridLayout(1,3,8,0)); actions.setOpaque(false); actions.add(search); actions.add(all); actions.add(add); top.add(actions, BorderLayout.EAST); p.add(top, BorderLayout.NORTH);

        inventoryModel = model("ID","Medicine","Category","Price (₹)","Stock","Expiry","Status");
        inventoryTable = table(inventoryModel); inventoryTable.addMouseListener(new MouseAdapter(){public void mouseClicked(MouseEvent e){if(e.getClickCount()==2) stockDialog();}});
        p.add(scroll(inventoryTable), BorderLayout.CENTER);
        JPanel bottom = new JPanel(new FlowLayout(FlowLayout.RIGHT)); bottom.setOpaque(false); bottom.add(stock); p.add(bottom, BorderLayout.SOUTH);
        setPage(p); refreshInventory(PharmacyServer.getMedicinesForGui());
    }

    private void showBilling() {
        JPanel p = page("Customer Billing", "Process a sale, update stock and generate a printable bill preview.");
        JPanel body = new JPanel(new GridLayout(1,2,16,0)); body.setOpaque(false);
        JPanel form = formPanel("SALE DETAILS");
        customerField = new JTextField(); phoneField = new JTextField(); quantityField = new JTextField("1");
        medicineCombo = new JComboBox<>(); for (PharmacyServer.Medicine m : PharmacyServer.getMedicinesForGui()) medicineCombo.addItem(m.id + " — " + m.name);
        addFormRow(form,"Customer name",customerField); addFormRow(form,"Phone",phoneField); addFormRow(form,"Medicine",medicineCombo); addFormRow(form,"Quantity",quantityField);
        JButton bill = actionButton("Generate Bill"); bill.addActionListener(e -> generateBill()); form.add(bill);
        body.add(form);
        JPanel preview = formPanel("BILL PREVIEW"); preview.setLayout(new BorderLayout(0,12)); JLabel previewTitle=new JLabel("BILL PREVIEW"); previewTitle.setForeground(ACCENT); previewTitle.setFont(new Font("SansSerif",Font.BOLD,10)); preview.add(previewTitle,BorderLayout.NORTH); billArea = new JTextArea(); billArea.setEditable(false); billArea.setFont(new Font(Font.MONOSPACED,Font.PLAIN,12)); billArea.setForeground(TEXT); billArea.setBackground(new Color(8,15,25)); billArea.setBorder(new EmptyBorder(14,14,14,14)); preview.add(scroll(billArea), BorderLayout.CENTER); body.add(preview);
        p.add(body, BorderLayout.CENTER); setPage(p);
    }

    private JPanel formPanel(String title) { JPanel p=new JPanel(); p.setLayout(new BoxLayout(p, BoxLayout.Y_AXIS)); p.setBackground(PANEL); p.setBorder(BorderFactory.createCompoundBorder(BorderFactory.createLineBorder(BORDER),new EmptyBorder(16,16,16,16))); JLabel l=new JLabel(title); l.setForeground(ACCENT); l.setFont(new Font("SansSerif",Font.BOLD,10)); l.setAlignmentX(Component.LEFT_ALIGNMENT); p.add(l); p.add(Box.createVerticalStrut(12)); return p; }
    private void addFormRow(JPanel parent,String label,JComponent field){ JPanel row=new JPanel(new BorderLayout(0,6)); row.setOpaque(false); JLabel l=new JLabel(label); l.setForeground(MUTED); l.setFont(new Font("SansSerif",Font.BOLD,11)); row.add(l,BorderLayout.NORTH); styleComponent(field); row.add(field,BorderLayout.CENTER); parent.add(row); }

    private void generateBill(){ try { String selected=(String)medicineCombo.getSelectedItem(); if(selected==null) throw new IllegalArgumentException("Select a medicine."); String id=selected.split(" — ",2)[0]; int qty=Integer.parseInt(quantityField.getText().trim()); PharmacyServer.Billing b=PharmacyServer.processSaleForGui(customerField.getText(),phoneField.getText(),id,qty); StringBuilder out=new StringBuilder(); out.append("PHARMACARE\n========================================\n"); out.append("Bill No : ").append(b.billNumber).append("\nDate    : ").append(b.date).append("\nCustomer: ").append(b.customer.name).append("\nPhone   : ").append(b.customer.phone).append("\n========================================\n"); for(PharmacyServer.CartItem item:b.items) out.append(String.format("%-24s x%-3d ₹%8.2f%n",item.medicine.name,item.quantity,item.amount())); out.append("========================================\n"); out.append(String.format("TOTAL                         ₹%.2f%n",b.total())); out.append("========================================\nThank you for visiting PharmaCare!"); billArea.setText(out.toString()); refreshAll(); JOptionPane.showMessageDialog(this,"Bill generated successfully: "+b.billNumber,"Success",JOptionPane.INFORMATION_MESSAGE); } catch(Exception ex){ JOptionPane.showMessageDialog(this,ex.getMessage(),"Billing Error",JOptionPane.ERROR_MESSAGE); } }

    private void showSales(){ JPanel p=page("Sales Records","Completed customer purchases stored in LinkedList<Billing>."); salesModel=model("Bill No","Date","Customer","Phone","Medicine","Qty","Total (₹)"); JTable t=table(salesModel); for(PharmacyServer.Billing b:PharmacyServer.getSalesForGui()){ for(PharmacyServer.CartItem i:b.items) salesModel.addRow(new Object[]{b.billNumber,b.date,b.customer.name,b.customer.phone,i.medicine.name,i.quantity,String.format("%.2f",b.total())}); } p.add(scroll(t),BorderLayout.CENTER); setPage(p); }

    private void addMedicineDialog(){ JPanel panel=new JPanel(new GridLayout(0,2,8,8)); JTextField id=new JTextField(),name=new JTextField(),cat=new JTextField(),price=new JTextField(),stock=new JTextField(),expiry=new JTextField("2028-12-31"); panel.add(new JLabel("Medicine ID"));panel.add(id);panel.add(new JLabel("Name"));panel.add(name);panel.add(new JLabel("Category"));panel.add(cat);panel.add(new JLabel("Price"));panel.add(price);panel.add(new JLabel("Stock"));panel.add(stock);panel.add(new JLabel("Expiry (YYYY-MM-DD)"));panel.add(expiry); int r=JOptionPane.showConfirmDialog(this,panel,"Add Medicine",JOptionPane.OK_CANCEL_OPTION,JOptionPane.PLAIN_MESSAGE); if(r==JOptionPane.OK_OPTION){try{PharmacyServer.addMedicineForGui(id.getText(),name.getText(),cat.getText(),Double.parseDouble(price.getText()),Integer.parseInt(stock.getText()),LocalDate.parse(expiry.getText()));refreshInventory(PharmacyServer.getMedicinesForGui());refreshAll();JOptionPane.showMessageDialog(this,"Medicine added successfully.");}catch(Exception ex){JOptionPane.showMessageDialog(this,ex.getMessage(),"Error",JOptionPane.ERROR_MESSAGE);}} }
    private void stockDialog(){ if(inventoryTable==null||inventoryTable.getSelectedRow()<0){JOptionPane.showMessageDialog(this,"Select a medicine first.");return;} String id=inventoryTable.getValueAt(inventoryTable.getSelectedRow(),0).toString(); String s=JOptionPane.showInputDialog(this,"Stock adjustment (+10 or -5):","0"); if(s!=null)try{PharmacyServer.updateStockForGui(id,Integer.parseInt(s.trim()));refreshInventory(PharmacyServer.getMedicinesForGui());refreshAll();}catch(Exception ex){JOptionPane.showMessageDialog(this,ex.getMessage(),"Error",JOptionPane.ERROR_MESSAGE);} }

    private void refreshInventory(List<PharmacyServer.Medicine> list){if(inventoryModel==null)return; inventoryModel.setRowCount(0); for(PharmacyServer.Medicine m:list) inventoryModel.addRow(new Object[]{m.id,m.name,m.category,String.format("%.2f",m.price),m.stock,m.expiry,m.status()}); }
    private void refreshAll(){List<PharmacyServer.Medicine> ms=PharmacyServer.getMedicinesForGui(); if(medicineCountLabel!=null)medicineCountLabel.setText(String.valueOf(ms.size())); if(stockValueLabel!=null)stockValueLabel.setText(String.valueOf(ms.stream().mapToInt(m->m.stock).sum())); if(salesCountLabel!=null)salesCountLabel.setText(String.valueOf(PharmacyServer.getSalesForGui().size())); if(inventoryModel!=null)refreshInventory(ms); }

    private void setPage(JPanel page){ Component old=getContentPane().getComponentCount()>0?getContentPane().getComponent(1):null; if(old!=null)getContentPane().remove(old); getContentPane().add(page,BorderLayout.CENTER); revalidate(); repaint(); }

    private DefaultTableModel model(String... cols){return new DefaultTableModel(cols,0){public boolean isCellEditable(int r,int c){return false;}};}
    private JTable table(DefaultTableModel m){JTable t=new JTable(m);t.setRowHeight(30);t.setBackground(PANEL);t.setForeground(TEXT);t.setGridColor(BORDER);t.setSelectionBackground(new Color(26,70,75));t.setSelectionForeground(TEXT);t.getTableHeader().setBackground(PANEL2);t.getTableHeader().setForeground(TEXT);t.getTableHeader().setFont(new Font("SansSerif",Font.BOLD,11));DefaultTableCellRenderer center=new DefaultTableCellRenderer();center.setHorizontalAlignment(SwingConstants.CENTER);return t;}
    private JScrollPane scroll(Component c){JScrollPane s=new JScrollPane(c);s.setBorder(BorderFactory.createLineBorder(BORDER));s.getViewport().setBackground(PANEL);return s;}
    private JButton actionButton(String text){JButton b=new JButton(text);b.setForeground(Color.WHITE);b.setBackground(ACCENT);b.setFont(new Font("SansSerif",Font.BOLD,11));b.setFocusPainted(false);b.setBorder(new EmptyBorder(10,16,10,16));return b;}
    private void styleField(JTextField f){f.setBackground(PANEL2);f.setForeground(TEXT);f.setCaretColor(TEXT);f.setBorder(BorderFactory.createCompoundBorder(BorderFactory.createLineBorder(BORDER),new EmptyBorder(8,10,8,10)));}
    private void styleComponent(JComponent c){if(c instanceof JTextField)styleField((JTextField)c);else if(c instanceof JComboBox){c.setBackground(PANEL2);c.setForeground(TEXT);}}

    public static void main(String[] args){try{UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());}catch(Exception ignored){} SwingUtilities.invokeLater(()->new PharmacySwingApp().setVisible(true));}
}
