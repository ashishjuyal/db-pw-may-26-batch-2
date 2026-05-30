package com.test;

public class StringReverser {
    public String reverse(String s) {
        if(s == null)
            throw new IllegalArgumentException("cannot be null");
        StringBuilder builder = new StringBuilder();
        for(int i = s.length()-1; i >= 0; i--) {
            builder.append(s.charAt(i));
        }
        return builder.toString();
    }
}
