package codesmells.changepreventer.divergentchange;

public class Account {
  private final int accountNumber;
  private double balance = 0;

  public Account(int accountNumber) {
    this.accountNumber = accountNumber;
  }

  public void credit(double amount) {
    balance += amount;
  }

  public void debit(double amount) {
    balance -= amount;
  }

  //serializing the account to xml
  public String toXml() {
    return "<account><id>" + getAccountNumber() + "</id>" +
        "<balance>" + getBalance() + "</balance></account>";
  }

  public int getAccountNumber() {
    return this.accountNumber;
  }

  public double getBalance() {
    return this.balance;
  }
}
