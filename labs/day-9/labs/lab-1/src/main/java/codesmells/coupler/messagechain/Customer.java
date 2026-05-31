package codesmells.coupler.messagechain;

public class Customer {
  private final Address address;

  public Customer(Address address) {
    this.address = address;
  }

  public Address getAddress() {
    return this.address;
  }
}