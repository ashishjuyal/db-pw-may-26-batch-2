package codesmells.bloaters.dataclumps;

import org.junit.Test;

import static org.junit.Assert.assertEquals;

public class CustomerTest {

    @Test public void
    should_display_customers_address_details() {
        Customer customer = new Customer();

        customer.setHouse("999");
        customer.setSteet("Some street");
        customer.setCity("Gurgaon");
        customer.setPostcode("111888");
        customer.setCountry("India");

        assertEquals("999, Some street, Gurgaon, 111888, India", customer.getAddressSummary());
    }
}