package refactoring.functions;

import org.junit.Test;

import static org.junit.Assert.*;

public class RatingTest {

  @Test public void
  Should_return_false_when_provided_invalid_rating() {
    Rating rating = new Rating("0");
    assertFalse(rating.isValidRating());
  }

  @Test public void
  Should_return_B_RATING() {
    Rating rating = new Rating("B1");
    assertTrue(rating.isValidRating());
  }

  @Test public void
  Should_return_A_RATING() {
    Rating rating = new Rating("A11");
    assertTrue(rating.isValidRating());
  }
}