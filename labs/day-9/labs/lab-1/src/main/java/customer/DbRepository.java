package customer;

import java.util.Arrays;
import java.util.List;

public class DbRepository {

  // Assume this data is getting fetched from the Database and the database will not be available while testing
  public List<Customer> findAll() {
    return Arrays.asList(
      new Customer("1", "Ashish", "New Delhi"),
      new Customer("2", "Rob", "New York"),
      new Customer("3", "Rajesh", "Mumbai"),
      new Customer("4", "Ankit", "Chennai"),
      new Customer("5", "Stephan", "New York")
    );
  }

}
