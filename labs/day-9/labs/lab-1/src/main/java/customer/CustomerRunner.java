package customer;

import java.util.List;

public class CustomerRunner {

  public static void main(String[] args) {
    CustomerService service = new CustomerService();

    List<Customer> customers = service.getCustomersByCity("New York");

    System.out.println(customers);
  }
}
