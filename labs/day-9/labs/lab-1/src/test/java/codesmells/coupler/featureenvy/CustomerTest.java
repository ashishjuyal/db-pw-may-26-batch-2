package codesmells.coupler.featureenvy;

import org.junit.Test;

import static org.junit.Assert.assertEquals;

public class CustomerTest {

  @Test public void
  should_format_phone_number() {
    Phone phone = new Phone("919876543210");
    Customer customer = new Customer(phone);
    assertEquals("(919) 876-5432", customer.getMobilePhoneNumber());
  }
}
