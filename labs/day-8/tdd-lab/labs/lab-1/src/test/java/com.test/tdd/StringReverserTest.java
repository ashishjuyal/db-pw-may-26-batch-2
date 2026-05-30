package com.test.tdd;

import com.test.StringReverser;
import org.junit.Assert;
import org.junit.Test;

import static org.junit.Assert.assertEquals;

public class StringReverserTest {

    /**
     * reverse("") -> "" DONE
     * reverse("a") -> "a" DONE
     * reverse("abc") -> "cba" DONE
     * reverse(null) -> throw Exception
     * */

    @Test public void
    should_return_empty_when_input_empty() {
        StringReverser reverser = new StringReverser();
        assertEquals("", reverser.reverse(""));
    }

    @Test public void
    should_return_single_char_when_input_is_single() {
        StringReverser reverser = new StringReverser();
        assertEquals("a", reverser.reverse("a"));
    }

    @Test public void
    should_return_reverse_of_a_string() {
        StringReverser reverser = new StringReverser();
        assertEquals("cba", reverser.reverse("abc"));
    }

    @Test(expected = IllegalArgumentException.class) public void
    should_throw_exception_when_null() {
        StringReverser reverser = new StringReverser();
        reverser.reverse(null);
    }
}