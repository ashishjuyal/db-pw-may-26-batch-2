package codesmells.changepreventer.divergentchange;

import org.junit.Before;
import org.junit.Test;

import static org.junit.Assert.*;

public class AccountTest {
  Account account;

  @Before public void
  setUp() {
    account = new Account(1000);
  }

  @Test public void
  credit_should_make_a_balance_of_1_000_000() {
    account.credit(1_000_000d);
    assertEquals(1000, account.getAccountNumber());
    assertEquals(1_000_000d, account.getBalance(), 0.1);
  }

  @Test public void
  debit_should_make_a_balance_of_1_000_000() {
    account.debit(1_000_000d);
    assertEquals(-1_000_000d, account.getBalance(), 0.1);
  }

  @Test public void
  should_return_XML_correctly() {
    account.credit(1d);
    String result = "<account><id>1000</id><balance>1.0</balance></account>";
    assertEquals(result, account.toXml());
  }
}