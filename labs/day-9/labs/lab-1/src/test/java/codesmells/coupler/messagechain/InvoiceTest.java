package codesmells.coupler.messagechain;

import org.junit.Before;
import org.junit.Test;

import static org.junit.Assert.*;

public class InvoiceTest {

  Invoice invoice;

  @Before public void
  setup_invoice_with_shipping_costs() {
    invoice = new Invoice(new Customer(new Address(new Country("South Africa", "Africa"))));
  }

  @Test public void
  Should_return_regular_price_of_one_item_with_shipping_cost() {
    InvoiceItem item = new InvoiceItem(100);
    invoice.addItem(item);
    assertEquals(110, invoice.getTotalPrice(), 0.1);
  }

  @Test public void
  Should_return_regular_price_of_two_item() {
    InvoiceItem item = new InvoiceItem(100);
    invoice.addItem(item);
    invoice.addItem(item);
    assertEquals(210, invoice.getTotalPrice(), 0.1);
  }

}