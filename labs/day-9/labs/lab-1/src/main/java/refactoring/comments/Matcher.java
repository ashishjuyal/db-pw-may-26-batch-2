package refactoring.comments;

public class Matcher {
  public Matcher() {}

  public boolean match(int[] expected, int[] actual,
                       int clipLimit, int delta) {
// Clip "too-large" values
    for (int i1 = 0; i1 < actual.length; i1++)
      if (actual[i1] > clipLimit)
        actual[i1] = clipLimit;
// Check for length differences
    if (actual.length != expected.length)
      return false;
// Check that each entry is within expected +/- delta
    for (int i = 0; i < actual.length; i++)
      if (Math.abs(expected[i] - actual[i]) > delta)
        return false;
    return true;
  }

}