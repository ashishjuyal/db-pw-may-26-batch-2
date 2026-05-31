package codesmells.coupler.featureenvy;

// Customer is performing repeated accesses on Phone's data to format the number
public class Customer {
  private Phone mobilePhone;

  public Customer(Phone phone) {
    this.mobilePhone = phone;
  }

  public String getMobilePhoneNumber() {
    return "(" +
        mobilePhone.getAreaCode() + ") " +
        mobilePhone.getPrefix() + "-" +
        mobilePhone.getNumber();
  }

}
