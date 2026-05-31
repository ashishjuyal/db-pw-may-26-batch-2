Long Methods
==========
Large number of lines in the method.

What to Do
------------
Use <em>Extract Method</em> to break up the method into smaller pieces. Look for comments or white space that delineate “interesting” blocks. You want to extract methods that are semantically meaningful, not just introduce a function call every seven lines. 

You may find other refactorings (those that clean up straight-line code, conditionals, and variable usage) helpful before you even begin splitting up the method.