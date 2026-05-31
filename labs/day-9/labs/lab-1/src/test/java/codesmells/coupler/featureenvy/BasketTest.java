package codesmells.coupler.featureenvy;

import org.junit.Test;

import java.util.Collections;
import java.util.List;

import static org.junit.Assert.assertEquals;

public class BasketTest {

  @Test public void
  should_test_total_price() {
    Item item = new Item(100, 10, 5, true);
    Basket basket = new Basket(Collections.singletonList(item));

    float totalPrice = basket.getTotalPrice(item);
    assertEquals(105.0, totalPrice, 0.2);
  }

  @Test public void
  should_test_basket_total_price() {
    Item item1 = new Item(100, 10, 5, true);
    Item item2 = new Item(100, 10, 5, true);
    Basket basket = new Basket(List.of(item1, item2));

    float totalPrice = basket.getBasketTotal();
    assertEquals(210.0, totalPrice, 0.2);
  }

}