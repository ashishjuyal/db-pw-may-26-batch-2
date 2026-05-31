package codesmells.coupler.messagechain;

public class InvoiceItem {

  private final int price;

  public InvoiceItem(int price) {
    this.price = price;
  }

  public double getSubTotal() {
    return this.price;
  }
}