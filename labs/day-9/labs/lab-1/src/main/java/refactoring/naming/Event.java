package refactoring.naming;

class Event {
  private final int d;
  private final Time t;

  public Event(int d, Time t) {
    this.d = d;
    this.t = t;
  }
  public int getDay() {
    return d;
  }

  public Time getTime() {
    return t;
  }

  public boolean canApply() {
    if (this.getDay() == 6 || this.getDay() == 0) {
      return false;
    } else {
      return (this.getTime().getHour() >= 8 && this.getTime().getHour() < 18);
    }
  }
}
