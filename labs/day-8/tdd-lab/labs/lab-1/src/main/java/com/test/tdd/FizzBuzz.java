package com.test.tdd;

public class FizzBuzz {
    public String check(int i) {
        boolean isFizz = i % 3 == 0;
        boolean isBuzz = i % 5 == 0;

        if(isFizz && isBuzz) {
            return "FizzBuzz";
        } else if (isFizz) {
            return "Fizz";
        } else if(isBuzz) {
            return "Buzz";
        }
        return String.valueOf(i);
    }
}
