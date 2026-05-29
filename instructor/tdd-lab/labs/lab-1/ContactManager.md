## Contact manager kata

1. A contact manager adds a new contact and stores in a contact list.
2. The contact will have the following attributes:
   - firstName
   - lastName
   - phoneNumber
3. The contact is validated before adding the contact to the contact list. 
4. It throws `RunTimeException` when the:
   - contact is added twice. Uniqueness of the contact needs to be done based on the `firstname-lastname`.
   - first name is blank.
   - last name is blank.
   - phone number is blank.
   - length is not 10.
   - contains other than digits.
   - does not start with 0.
