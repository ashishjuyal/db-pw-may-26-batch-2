## Payment Processor

In this exercise you need to design a `PaymentProcessor`. The `PaymentProcessor` interacts with three dependencies:
- `PaymentGateway`
- `InvoiceService` 
- `EmailService`. 

We want to verify that the payment is processed before generating the invoice. An email should be sent after the successful payment. Another email should be sent after generating the invoice.

<br>

PaymentProcessor.java
```java
public void process(String customerId, double amount)
```

PaymentGateway.java
```java
void processPayment(String customerId, double amount)
```

InvoiceService.java
```java
void generateInvoice(String customerId, double amount)
```

EmailService.java
```java
void send(String customerId, double amount, String body)
```
- After successful payment processing an email should be sent with the body as "payment processed".
- After successful invoice generation an email should be sent with the body as "invoice generated, please find attached".

