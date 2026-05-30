package com.test.tdd;

import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;

public class FizzBuzzTest {

    FizzBuzz fb;
    @Before
    public void setup() {
        fb = new FizzBuzz();
    }
    /**
     * check(1) -> 1
     * check(2) -> 2 // helps in triangulation
     * check(3) -> Fizz
     * check(5) -> Buzz
     * check(6) -> Fizz // multiple of 3
     * check(10) -> Buzz // multiple of 5
     * check(15) -> FizzBuzz
     * */

    @Test public void
    should_return_1_when_1() {
        Assert.assertEquals("1", fb.check(1));
    }

    @Test public void
    should_return_2_when_2() {
        Assert.assertEquals("2", fb.check(2));
    }

    @Test public void
    should_return_Fizz_when_3() {
        Assert.assertEquals("Fizz", fb.check(3));
    }

    @Test public void
    should_return_Buzz_when_5() {
        Assert.assertEquals("Buzz", fb.check(5));
    }

    @Test public void
    should_return_Fizz_when_multiple_of_3() {
        Assert.assertEquals("Fizz", fb.check(6));
    }

    @Test public void
    should_return_Buzz_when_multiple_of_5() {
        Assert.assertEquals("Buzz", fb.check(10));
    }

    @Test public void
    should_return_FizzBuzz_when_multiple_of_5_and_3() {
        Assert.assertEquals("FizzBuzz", fb.check(15));
    }
}
