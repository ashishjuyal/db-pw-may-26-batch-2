# String Calculator Kata

Create a simple String calculator with a method `int Add(string numbers)`, it can take any amount of numbers and returns the sum. The numbers are delimited by comma `","` and/or new line character `"\n”`, for e.g `“1,2,3”` and `“1\n2,3”` are valid examples. The function should return `zero` when the input numbers is empty and should throw an exception if there is any negative number, if there are many negative numbers, show them all in the exception message.

Bonus step(optional):
Numbers bigger than 1000 should be ignored, so adding 2 + 1001  = 2

**Note**: Make sure you only test for correct inputs. there is no need to test for invalid inputs for this exercise

- New requirement: The string calculator should work only between `9AM and 6PM`. In case it is used outside the working hours, return `zero`.