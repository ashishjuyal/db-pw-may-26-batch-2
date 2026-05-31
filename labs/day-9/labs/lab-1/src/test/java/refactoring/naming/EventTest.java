package refactoring.naming;

import org.junit.Assert;
import org.junit.Test;

public class EventTest {

  @Test public void
  Should_return_true_when_the_event_occurred_is_during_working_hours() {
    Time t = new Time(10);
    Event e = new Event(4, t);

    Assert.assertTrue(e.canApply());
  }

  @Test public void
  Should_return_false_when_the_event_occurred_after_working_hours() {
    Time t = new Time(20);
    Event e = new Event(4, t);

    Assert.assertFalse(e.canApply());
  }

  @Test public void
  Should_return_false_when_the_event_occurred_during_working_hours_in_non_working_day() {
    Time t = new Time(20);
    Event e = new Event(6, t);

    Assert.assertFalse(e.canApply());
  }
}