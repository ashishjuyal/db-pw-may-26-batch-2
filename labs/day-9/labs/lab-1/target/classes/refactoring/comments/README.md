Comments
==========
Usually, for the best of reasons. The author realizes that something isn’t as clear as it
could be, and adds a comment.

What to Do
------------
- When a comment explains a block of code, you can often use <em>Extract Method</em> to pull the block out into a separate method. The comment will often suggest a name for the new method.
- When a comment explains what a method does (better than the method’s name!), use <em>Rename Method</em> using the comment as the basis of the new name.
- When a comment explains preconditions, consider using <em>Introduce Assertion</em> to replace the comment with code.