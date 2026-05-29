# Exercise: String Reverser

Objective: Practice Test-Driven Development (TDD) by implementing a simple String Reverser.

Problem Statement: Implement a function that takes a string as input and returns the reverse of the string.

Throughout the exercise, focus on the importance of following the TDD cycle: `Write a failing test`, `implement the code`, and `refactor`. You have to run the tests frequently, observe the failures, and iterate until all tests pass. 

Important: Keep the implementation simple and focus on solving one problem at a time.

## TDD Steps:

📋 Step 1: Write a failing test
- Start by writing a failing test that verifies the reverseString function's behavior.
- In this case, the test will check if the function correctly reverses a given string.
- Example Test (in pseudocode):

```
reverseString("hello") should return "olleh"
```

📋 Step 2: Implement the minimum code
- Implement the reverseString function with the minimum code necessary to make the test pass.
- For this exercise, you can use any programming language of your choice.
- Example (in Java):
```java
public String reverseString(String input) {
    // TODO: Implement the logic to reverse the input string
    return null; // Placeholder return statement
}
```

📋 Step 3: Run the test and observe the failure
- Run the test to verify that it fails, as expected.
- The failure indicates that the implemented code does not yet satisfy the test's requirements.

📋 Step 4: Write additional tests
- Write additional tests to cover different scenarios and edge cases.
- Consider tests for empty strings, single characters, and strings with special characters.
- Example Test (in pseudocode):

```
reverseString("") should return ""
reverseString("a") should return "a"
reverseString("1234567890") should return "0987654321"
```

📋 Step 5: Update the implementation
- Refactor the reverseString function to satisfy the new tests while ensuring it still passes the initial test.
- Example (in Java):

```java
public String reverseString(String input) {
    return new StringBuilder(input).reverse().toString();
}
```
📋 Step 6: Run the tests and observe the passing results
- Run all the tests and verify that they pass successfully.
- Each test should individually pass, indicating that the implementation satisfies the specified requirements.

📋 Step 7: Refactor the code
- Review the code and consider any possible improvements or code smells.
- Refactor the code to improve readability, eliminate duplication, or enhance performance (if necessary).
- Example Refactored Implementation (in Java):
```java
public String reverseString(String input) {
    if (input == null) {
        throw new IllegalArgumentException("Input cannot be null");
    }
    return new StringBuilder(input).reverse().toString();
}
```

📋 Step 8: Repeat the TDD cycle (optional)
- If time permits, consider repeating the TDD cycle by adding more functionality or refining the existing implementation.
- Add new tests, update the code, and ensure all tests pass before proceeding.

