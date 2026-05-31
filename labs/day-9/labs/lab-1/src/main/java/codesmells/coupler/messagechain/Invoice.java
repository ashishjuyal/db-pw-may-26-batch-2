package codesmells.coupler.messagechain;

import java.util.ArrayList;
import java.util.List;

public class Invoice {
  private static final int SHIPPING_COST_OUTSIDE_EU = 10;
  private final List<InvoiceItem> invoiceItems = new ArrayList<>();
  private final Customer customer;

  public Invoice(Customer customer) {
    this.customer = customer;
  }

  public void addItem(InvoiceItem invoiceItem) {
    invoiceItems.add(invoiceItem);
  }

  public double getTotalPrice() {
    double invoiceTotal = 0;

    for (InvoiceItem invoiceItem : invoiceItems) {
      invoiceTotal += invoiceItem.getSubTotal();
    }

    if (!customer.getAddress().getCountry().getContinentName().equalsIgnoreCase("Europe")) {
      invoiceTotal += SHIPPING_COST_OUTSIDE_EU;
    }
    return invoiceTotal;
  }
}