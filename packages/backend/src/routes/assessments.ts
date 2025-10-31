import { Router } from 'express';
import { firebaseService } from '@/services/firebase';
import { geminiService } from '@/services/gemini';
import { logger } from '@/utils/logger';

const router = Router();

// Start an assessment for an objective: generate AI-powered questions
router.post('/start', async (req: any, res) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { objectiveId, count = 25 } = req.body as {
    objectiveId: string;
    count?: number;
  };

  if (!objectiveId) {
    return res.status(400).json({ success: false, message: 'objectiveId is required' });
  }

  try {
    // Fetch the objective details
    const objectiveDoc = await firebaseService.getDocument('objectives', objectiveId);

    if (!objectiveDoc) {
      return res.status(404).json({ success: false, message: 'Objective not found' });
    }

    if (objectiveDoc['userId'] !== uid) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // Generate AI-powered questions based on objective
    let questions;

    // Development mock toggle: use mock questions instead of calling Gemini
    // Force mock by default - STILL NOT WORKING? Check: req.query.mock or set GEMINI_MOCK=true
    const useMock =
      process.env['GEMINI_MOCK'] === 'true' ||
      req.query?.mock === 'true' ||
      req.body?.mock === true ||
      true; // TEMPORARILY FORCE MOCK - REMOVE THIS LINE TO USE REAL AI
    if (useMock) {
      logger.info('Using mock assessment questions (25 interview-style questions)');
      // Temporary mock assessment with 25 interview-style questions for Senior Java Developer
      const baseId = Date.now();
      questions = [
        {
          id: `quiz_${baseId}_0`,
          question:
            'Which of the following `CompletableFuture` methods is typically used to handle an exception and return a default value if an error occurs during the asynchronous computation?',
          options: [
            'exceptionally(Function<Throwable, ? extends T> fn)',
            'handle(BiFunction<? super T, Throwable, ? extends U> fn)',
            'thenApply(Function<? super T, ? extends U> fn)',
            'whenComplete(BiConsumer<? super T, ? super Throwable> action)',
          ],
          correctAnswer: 0,
          explanation:
            '`exceptionally()` allows handling an exception by providing a fallback value or computing an alternative result, effectively recovering from the error and continuing the chain. `handle()` can also recover but returns a new `CompletableFuture` and always receives both result and exception. `thenApply()` is for successful computation, and `whenComplete()` is for side effects.',
          difficulty: 'medium',
          category: 'Core Java',
          usageExample:
            'In an asynchronous service call, if the remote service fails, `future.exceptionally(ex -> defaultValue)` can prevent the entire pipeline from failing and return a known default.',
          skills: ['CompletableFuture', 'Asynchronous Programming', 'Concurrency'],
        },
        {
          id: `quiz_${baseId}_1`,
          question:
            'Consider a Spring service method annotated with `@Transactional(propagation = Propagation.REQUIRES_NEW)`. If this method is called from another `@Transactional` method within the same Spring bean, what will be the transactional behavior?',
          options: [
            "The inner method will join the outer method's transaction.",
            'A new, independent transaction will be started for the inner method. The outer transaction will be suspended.',
            'Both methods will run without any transactional context.',
            'An exception will be thrown because `REQUIRES_NEW` cannot be nested.',
          ],
          correctAnswer: 1,
          explanation:
            '`Propagation.REQUIRES_NEW` always starts a new, independent transaction. If an existing transaction is present, it will be suspended, and a new one will be created for the annotated method. Upon completion of the inner method, the outer transaction resumes.',
          difficulty: 'medium',
          category: 'Spring Framework',
          usageExample:
            'This is often used for operations that must commit or rollback independently, such as logging critical events, even if the calling transaction fails.',
          skills: ['Spring Transactions', '@Transactional', 'Transaction Propagation'],
        },
        {
          id: `quiz_${baseId}_2`,
          question: "Which statement correctly describes Java's type erasure regarding generics?",
          options: [
            'Generic type information is fully preserved at runtime through reflection.',
            'Generic type information is only available at compile time and is removed by the compiler, replaced by raw types or their upper bounds.',
            'Type erasure only applies to primitive types, not object types.',
            'Type erasure converts all generic types into `java.lang.Object` at runtime, making casts explicit.',
          ],
          correctAnswer: 1,
          explanation:
            'Java generics are implemented using type erasure. This means that generic type information (like `List<String>১০`) is only used at compile time for type checking and is removed during compilation. At runtime, `List<String>` becomes a raw `List`, with type parameters replaced by their upper bounds (typically `Object`).',
          difficulty: 'medium',
          category: 'Core Java',
          usageExample:
            'Understanding type erasure helps explain why you cannot directly check `instanceof List<String>` at runtime or create arrays of generic types like `new List<String>[10]`.',
          skills: ['Generics', 'Type Erasure', 'JVM Internals'],
        },
        {
          id: `quiz_${baseId}_3`,
          question:
            'A Spring Data JPA repository method fetches a `Parent` entity with a `OneToMany` relationship to `Child` entities, which are lazily loaded. If you access `parent.getChildren()` outside of the transactional context that loaded the `Parent`, what common issue might occur?',
          options: [
            'A `ConcurrentModificationException` because the collection is modified.',
            'An `IllegalStateException` indicating a detached entity.',
            'A `LazyInitializationException` because the session is closed.',
            'A `NoResultException` as the children are not found.',
          ],
          correctAnswer: 2,
          explanation:
            '`LazyInitializationException` is a common issue when trying to access a lazily loaded collection (like `parent.getChildren()`) after the `EntityManager` session that loaded the parent entity has been closed. This typically happens when the entity is passed out of its transactional context before its lazy associations are accessed.',
          difficulty: 'hard',
          category: 'Spring Data JPA',
          usageExample:
            'This often manifests when a service method returns an entity with lazy collections, and a controller or view layer attempts to access those collections without an active transaction, leading to errors.',
          skills: ['ORM Performance', 'Lazy Loading', 'JPA Fetch Strategies', 'N+1 Problem'],
        },
        {
          id: `quiz_${baseId}_4`,
          question: 'In Java concurrency, what is the primary purpose of the `volatile` keyword?',
          options: [
            'To ensure atomic operations on a variable across multiple threads.',
            'To prevent instruction reordering and ensure visibility of changes to shared variables across threads.',
            'To enforce exclusive access to a block of code, similar to `synchronized`.',
            'To make a variable eligible for garbage collection immediately after its use.',
          ],
          correctAnswer: 1,
          explanation:
            'The `volatile` keyword guarantees visibility of writes to a variable by one thread to other threads, and it also prevents instruction reordering that might obscure changes. It does not guarantee atomicity for compound operations (like `i++`).',
          difficulty: 'hard',
          category: 'Core Java',
          usageExample:
            'A `volatile boolean` flag can be used to signal shutdown to a loop running in another thread, ensuring the change is immediately visible.',
          skills: ['Java Memory Model', 'Concurrency', 'Volatile'],
        },
        {
          id: `quiz_${baseId}_5`,
          question:
            'When writing an integration test for a Spring Boot application that interacts with a database, which annotation is most appropriate for testing a JPA repository, using an embedded H2 database and rollback after each test method?',
          options: ['@SpringBootTest', '@DataJpaTest', '@WebMvcTest', '@RestClientTest'],
          correctAnswer: 1,
          explanation:
            '`@DataJpaTest` is specifically designed for testing JPA components. It auto-configures an embedded database (like H2) and configures an `EntityManager` and Spring Data JPA repositories. By default, it rolls back transactions after each test, ensuring a clean state.',
          difficulty: 'medium',
          category: 'Testing',
          usageExample:
            'Used to verify custom queries in a `UserRepository` or test lifecycle events on entities without loading the entire Spring application context, making tests faster and more focused.',
          skills: ['Integration Testing', 'Spring Boot Testing', 'Spring Data JPA Testing'],
        },
        {
          id: `quiz_${baseId}_6`,
          question:
            'Which SOLID principle suggests that software entities (classes, modules, functions, etc.) should be open for extension, but closed for modification?',
          options: [
            'Single Responsibility Principle (SRP)',
            'Open/Closed Principle (OCP)',
            'Liskov Substitution Principle (LSP)',
            'Dependency Inversion Principle (DIP)',
          ],
          correctAnswer: 1,
          explanation:
            'The Open/Closed Principle (OCP) states that a class should be designed in such a way that its behavior can be extended without modifying its source code. This is often achieved through abstraction and polymorphism, allowing new functionality via inheritance or composition.',
          difficulty: 'medium',
          category: 'Software Design',
          usageExample:
            'Designing a reporting module where new report types can be added by implementing an interface, without altering the existing report generator class.',
          skills: ['SOLID Principles', 'Design Principles', 'Refactoring'],
        },
        {
          id: `quiz_${baseId}_7`,
          question:
            'When implementing JWT (JSON Web Token) authentication in a Spring Boot application, what is the primary role of the private key (or secret key) in the context of token issuance and validation?',
          options: [
            "To encrypt the token's payload, making it unreadable to unauthorized parties.",
            "To sign the token, verifying its authenticity and integrity, ensuring it hasn't been tampered with.",
            'To store user session information on the server-side for revocation.',
            'To provide a salt for hashing user passwords before storage.',
          ],
          correctAnswer: 1,
          explanation:
            'The private key (or shared secret in HMAC) is used to sign the JWT. This signature allows the recipient to verify that the token has not been altered since it was issued by the trusted party (its integrity) and that it was indeed issued by the expected sender (its authenticity). JWTs are typically encoded, not encrypted, meaning their payload is readable.',
          difficulty: 'medium',
          category: 'Spring Security',
          usageExample:
            "Upon successful user login, the authentication server signs a JWT with its private key. Subsequent requests include this token, and resource servers use the corresponding public key (or shared secret) to verify the token's signature before granting access.",
          skills: ['JWT', 'Authentication', 'Security Best Practices', 'REST API Security'],
        },
        {
          id: `quiz_${baseId}_8`,
          question:
            'Given a `List<Person>` where `Person` has `firstName` and `lastName` fields, which Stream API collector correctly groups people by their `lastName` into a `Map<String, List<Person>>`?',
          options: [
            'Collectors.groupingBy(Person::getLastName)',
            'Collectors.toMap(Person::getLastName, p -> p)',
            'Collectors.collectingAndThen(Person::getLastName, Collectors.toList())',
            'Collectors.groupingBy(p -> p.getLastName(), Collectors.toSet())',
          ],
          correctAnswer: 0,
          explanation:
            '`Collectors.groupingBy(classifier)` is the most straightforward way to group elements of a stream into a `Map` where the keys are derived from the classifier function and the values are `List`s of elements sharing that key. Option D would group into `Set`s, and Option B would not handle duplicate keys correctly.',
          difficulty: 'easy',
          category: 'Core Java',
          usageExample:
            'Used to efficiently categorize data, such as grouping transactions by customer ID or products by category, for subsequent processing or reporting.',
          skills: ['Stream API', 'Collectors', 'Functional Programming'],
        },
        {
          id: `quiz_${baseId}_9`,
          question:
            'How does Spring AOP (Aspect-Oriented Programming) typically implement aspect weaving in a Spring Boot application by default?',
          options: [
            'Compile-time weaving, modifying the bytecode before compilation.',
            'Load-time weaving, using a ClassLoader to modify bytecode when classes are loaded.',
            'Runtime weaving, using dynamic proxies for interfaces and CGLIB proxies for classes.',
            'Post-compile weaving, modifying compiled `.class` files directly.',
          ],
          correctAnswer: 2,
          explanation:
            'By default, Spring AOP uses dynamic proxies at runtime. For beans implementing interfaces, JDK dynamic proxies are used. For beans not implementing interfaces (or when `proxyTargetClass=true` is set), CGLIB proxies are used. This happens during the Spring application context initialization.',
          difficulty: 'medium',
          category: 'Spring Framework',
          usageExample:
            'Applying cross-cutting concerns like logging, security checks, or transaction management to methods without modifying the core business logic.',
          skills: ['Aspect-Oriented Programming', 'Spring AOP', 'Proxies'],
        },
        {
          id: `quiz_${baseId}_10`,
          question:
            'What is the primary benefit of using a distributed cache (e.g., Redis or Memcached) in a microservices architecture compared to a local cache (e.g., Caffeine or EHCache)?',
          options: [
            'It provides stronger transactional guarantees for cached data.',
            'It eliminates the need for any database access, improving performance significantly.',
            'It allows multiple service instances to share the same cached data, reducing redundant data fetching and ensuring consistency across instances.',
            'It automatically encrypts cached data, enhancing security without additional configuration.',
          ],
          correctAnswer: 2,
          explanation:
            'A distributed cache allows multiple instances of a service, or even different services, to share a common cache store. This ensures that all instances work with the same, up-to-date cached data, reduces the load on backend data sources, and avoids the N+1 cache problem that can occur with local caches across multiple instances.',
          difficulty: 'medium',
          category: 'Performance',
          usageExample:
            'Caching frequently accessed product information or user profiles in a distributed cache so that all instances of a product catalog service or user service can serve requests quickly from the same cached data.',
          skills: ['Caching Strategies', 'Distributed Caching', 'Redis'],
        },
        {
          id: `quiz_${baseId}_11`,
          question:
            'Which of the following is considered a best practice for exception handling in a backend Java application?',
          options: [
            'Catch `Exception` or `Throwable` broadly and log the stack trace silently.',
            'Use unchecked exceptions for recoverable errors and checked exceptions for programmatic errors.',
            'Wrap checked exceptions in meaningful unchecked exceptions (e.g., custom runtime exceptions) at architectural boundaries.',
            'Always re-throw exceptions immediately without logging or handling them at all.',
          ],
          correctAnswer: 2,
          explanation:
            'Wrapping checked exceptions in custom unchecked (runtime) exceptions at appropriate architectural boundaries (e.g., service layer to controller) simplifies method signatures, allows for consistent error handling (e.g., via `@ControllerAdvice`), and signals that an error is a systemic issue rather than a predictable business flow. Catching `Exception` broadly often hides problems, and unchecked exceptions are for errors that should typically halt execution or be handled by a global mechanism.',
          difficulty: 'easy',
          category: 'Core Java',
          usageExample:
            'A `SQLException` from a `Repository` might be caught and rethrown as a `DataAccessException` (Spring) or a custom `ServiceOperationFailedException` to provide a more abstract and consistent error message to the calling business logic.',
          skills: ['Exception Handling', 'Error Handling', 'Code Quality'],
        },
        {
          id: `quiz_${baseId}_12`,
          question:
            'Why is a database connection pool (e.g., HikariCP) essential for a high-performance backend application?',
          options: [
            'It encrypts all database communication automatically.',
            'It permanently stores all query results in memory to avoid redundant database calls.',
            'It manages a set of open database connections, reusing them to reduce the overhead of opening and closing new connections for each request.',
            'It translates SQL queries into a more efficient bytecode format for faster execution.',
          ],
          correctAnswer: 2,
          explanation:
            'Opening and closing database connections are expensive operations in terms of time and resources. A connection pool maintains a pool of open, ready-to-use connections. When the application needs a connection, it borrows one from the pool, uses it, and then returns it. This significantly reduces latency and overhead, especially under heavy load.',
          difficulty: 'easy',
          category: 'Database',
          usageExample:
            'In a web application, every HTTP request that needs database access can quickly get a connection from the pool without waiting for a new one to be established, improving response times and throughput.',
          skills: ['JDBC', 'Connection Pooling', 'Performance Optimization'],
        },
        {
          id: `quiz_${baseId}_13`,
          question:
            'In a microservices architecture, when dealing with eventual consistency for distributed transactions, which pattern is commonly used to ensure data consistency across multiple services?',
          options: [
            'Two-Phase Commit (2PC)',
            'Saga Pattern',
            'Bulkhead Pattern',
            'Circuit Breaker Pattern',
          ],
          correctAnswer: 1,
          explanation:
            'The Saga Pattern is a common way to manage distributed transactions and achieve eventual consistency in microservices. Instead of a single atomic transaction, a saga is a sequence of local transactions, where each local transaction updates data within a single service and publishes an event toскому trigger the next step. If a step fails, compensating transactions are executed to undo previous changes.',
          difficulty: 'hard',
          category: 'Microservices',
          usageExample:
            "An 'Order Placement' saga might involve creating an order in the 'Order Service', reserving inventory in the 'Inventory Service', and processing payment in去见 the 'Payment Service', with compensating actions if any step fails.",
          skills: [
            'Eventual Consistency',
            'Saga Pattern',
            'Distributed Transactions',
            'Microservices Architecture',
          ],
        },
        {
          id: `quiz_${baseId}_14`,
          question:
            'Which `Optional` method is best suited for transforming the value inside an `Optional` to another type, returning an empty `Optional` if the original is empty?',
          options: [
            'get()',
            'orElse(T other)',
            'map(Function<? super T, ? extends U> mapper)',
            'ifPresent(Consumer<? super T> action)',
          ],
          correctAnswer: 2,
          explanation:
            'The `map()` method transforms the value inside the `Optional` using a given function if the `Optional` is present. If the `Optional` is empty, it returns an empty `Optional` of the new type without invoking the mapper function. `get()` throws an exception if empty, `orElse()` provides a default, and `ifPresent()` is for side effects.',
          difficulty: 'easy',
          category: 'Core Java',
          usageExample:
            "If you have `Optional<User>` and want to get `Optional<String>` for the user's email, you would use `userOptional.map(User::getEmail)`.",
          skills: ['Optional', 'Null Safety', 'Functional Programming'],
        },
        {
          id: `quiz_${baseId}_15`,
          question:
            "In Maven, what is the primary purpose of a 'BOM' (Bill Of Materials) dependency?",
          options: [
            'To define the exact versions of a set of related dependencies, ensuring consistency across modules without explicitly specifying versions in each `pom.xml`.',
            'To compile all project sources into a single executable JAR file.',
            'To manage database migrations and schema evolution.',
            'To generate documentation from source code comments.',
          ],
          correctAnswer: 0,
          explanation:
            'A BOM is a special Maven dependency type (`<type>pom</type>` and `<scope>import</scope>` within `<dependencyManagement>`) that helps manage versions of a coherent set of artifacts. By importing a BOM, you can then declare dependencies from that set in your `pom.xml` without specifying their versions, ensuring all modules use compatible versions defined in the BOM.',
          difficulty: 'medium',
          category: 'Tooling',
          usageExample:
            'Spring Boot Starter POMs often function as BOMs, allowing you to easily manage consistent versions for all Spring Boot related dependencies in your project.',
          skills: ['Maven', 'Dependency Management', 'Build Automation'],
        },
        {
          id: `quiz_${baseId}_16`,
          question:
            'When extending Spring Data JPA repositories, you need to add custom methods that involve complex joins or criteria. Which approach is generally recommended for implementing such custom functionality?',
          options: [
            'Add new methods directly to the standard repository interface, and Spring Data JPA will auto-generate their implementation.',
            'Create a custom interface, implement it in a separate class, and extend the standard repository interface with the custom interface.',
            'Use `@Query` annotations directly on the repository interface for all complex queries.',
            'Write raw JDBC code directly within the service layer to perform complex queries.',
          ],
          correctAnswer: 1,
          explanation:
            "The recommended approach is to create a custom interface, provide an implementation for it in a class typically named `YourRepositoryImpl` (following Spring Data conventions), and then extend your main repository interface with this custom interface. This keeps the core repository clean and separates custom logic. While `@Query` is useful, it's not ideal for very complex or dynamic queries that might benefit from externalized logic or Criteria API.",
          difficulty: 'medium',
          category: 'Spring Data JPA',
          usageExample:
            'Creating a `CustomUserRepository` interface and `CustomUserRepositoryImpl` to provide advanced search capabilities for users based on multiple dynamic criteria.',
          skills: ['Custom JPA Repositories', 'QueryDSL', 'JPA Specifications', 'Spring Data'],
        },
        {
          id: `quiz_${baseId}_17`,
          question:
            'Which JVM argument is primarily used to set the initial heap size for a Java application?',
          options: ['-Xmx', '-Xms', '-XX:MaxPermSize', '-XX:NewRatio'],
          correctAnswer: 1,
          explanation:
            '`-Xms` (e.g., `-Xms512m`) sets the initial Java heap size. `-Xmx` sets the maximum heap size. `-XX:MaxPermSize` (or `-XX:MaxMetaspaceSize` in Java 8+) relates to the permanent generation/metaspace. `-XX:NewRatio` controls.scissors the ratio of the young to old generation.',
          difficulty: 'medium',
          category: 'Performance',
          usageExample:
            'Running a large Spring Boot application, you might start with `java -Xms1G -Xmx2G -jar myapp.jar` to allocate 1GB initially and allow it to grow up to 2GB.',
          skills: ['JVM Arguments', 'Garbage Collection', 'Heap Tuning'],
        },
        {
          id: `quiz_${baseId}_18`,
          question:
            'What is a key difference in handling backpressure between traditional imperative Spring MVC and reactive Spring WebFlux applications?',
          options: [
            'Spring MVC handles backpressure automatically through non-blocking I/O, while WebFlux requires explicit configuration.',
            'Spring WebFlux inherently supports backpressure mechanisms (e.g., using `Flux` and `Mono`) allowing consumers to signal their data consumption rate, while Spring MVC does not have built-in support for this at the application level.',
            'Spring MVC uses message queues to manage backpressure, whereas WebFlux avoids queues entirely.',
            'Backpressure is only relevant for database operations and not for HTTP requests in either framework.',
          ],
          correctAnswer: 1,
          explanation:
            "Spring WebFlux, built on Reactive Streams, inherently supports backpressure. Publishers (e.g., `Flux` or `Mono`) can be signaled by consumers to slow down data emission if the consumer cannot process data fast enough. Spring MVC, being imperative, doesn't have this built-in mechanism for application-level backpressure management, though its underlying servlet container might handle network-level flow control.",
          difficulty: 'hard',
          category: 'Spring Framework',
          usageExample:
            'A WebFlux service consuming a `Flux<Data>` from another service can signal the upstream service to send fewer items if its processing pipeline is getting overwhelmed, preventing resource exhaustion.',
          skills: ['Reactive Programming', 'Spring WebFlux', 'Backpressure'],
        },
        {
          id: `quiz_${baseId}_19`,
          question:
            'When using Mockito, if you need to capture an argument passed to a mocked method to inspect its internal state, which feature should you use?',
          options: [
            '`Mockito.verify()` with `any()`',
            '`Mockito.times()`',
            '`ArgumentCaptor`',
            '`Mockito.spy()`',
          ],
          correctAnswer: 2,
          explanation:
            "`ArgumentCaptor` is specifically designed to capture arguments passed to a mocked method. This allows you to inspect the argument's value after the method call, which is particularly useful for verifying the content of complex objects or callbacks. `verify()` confirms calls, `times()` verifies call count, and `spy()` creates a partial mock.",
          difficulty: 'medium',
          category: 'Testing',
          usageExample:
            "Testing a service that creates a `User` object and passes it to a `UserRepository.save(User)` method. You can capture the `User` object to assert its properties before it's saved.",
          skills: ['Mockito', 'Unit Testing', 'Argument Captors'],
        },
        {
          id: `quiz_${baseId}_20`,
          question:
            'What is the recommended logging facade for a typical Spring Boot application, and why?',
          options: [
            'Directly use `System.out.println()` for simplicity across environments.',
            "Use `java.util.logging` (JUL) directly as it's built into Java.",
            'Use SLF4J (Simple Logging Facade for Java) with an underlying implementation like Logback or Log4j2, because it decouples the logging API from the implementation.',
            'Use `jakarta.platform.logging` for container-managed logging exclusively.',
          ],
          correctAnswer: 2,
          explanation:
            "SLF4J is a facade that provides a simple API for logging, allowing the actual logging implementation (like Logback or Log4j2) to be swapped out without changing the application's code. Spring Boot heavily uses SLF4J and defaults to Logback, offering flexibility, performance, and advanced configuration options.",
          difficulty: 'easy',
          category: 'Tooling',
          usageExample:
            'Instead of `Logger log = Logger.getLogger(...)`, you write `private static final Logger log = LoggerFactory.getLogger(MyClass.class);` and use `log.info(...)`, providing flexibility in choosing the logging backend.',
          skills: ['Logging', 'SLF4J', 'Logback', 'Log4j2'],
        },
        {
          id: `quiz_${baseId}_21`,
          question: 'Which HTTP method should be designed to be idempotent for a RESTful API?',
          options: ['POST', 'GET', 'PUT', 'DELETE'],
          correctAnswer: 3,
          explanation:
            "Both GET, PUT, and DELETE methods should be idempotent. Idempotence means that multiple identical requests will have the same effect as a single request. GET is inherently idempotent. PUT and DELETE should also逛街 be idempotent: applying the same PUT request multiple times should leave the resource in the same state, and deleting a resource multiple times should result in the resource no longer existing (or consistently returning a 'not found' status after the first successful deletion). POST is generally not idempotent as it typically creates a new resource with each request.",
          difficulty: 'medium',
          category: 'API Design',
          usageExample:
            'A `DELETE /products/123` request should remove product 123. Sending this request multiple times should still result in product 123 being removed (or already gone), not causing an error or inconsistent state after the first successful deletion.',
          skills: ['REST Principles', 'Idempotency', 'HTTP Methods', 'Backend API Design'],
        },
        {
          id: `quiz_${baseId}_22`,
          question: 'Which of the following statements about Java ClassLoaders is FALSE?',
          options: [
            'The Bootstrap ClassLoader loads core Java classes like `java.lang.Object`.',
            "The Extension ClassLoader loads classes from the JRE's extension directory.",
            "The Application ClassLoader loads classes from the application's classpath.",
            'ClassLoaders directly handle method invocation and garbage collection of objects.',
          ],
          correctAnswer: 3,
          explanation:
            "ClassLoaders are responsible for finding and loading Java classes into the JVM at runtime, following a delegation model. They are not directly involved in method invocation (which is handled by the JVM's execution engine) or garbage collection (which is handled by the GC subsystem).",
          difficulty: 'hard',
          category: 'Core Java',
          usageExample:
            'Understanding ClassLoaders is crucial for dealing with classpath issues, hot-swapping classes, or developing plugins where different versions of libraries might need to coexist.',
          skills: ['Class Loaders', 'JVM Internals', 'Reflection'],
        },
        {
          id: `quiz_${baseId}_23`,
          question:
            'In a microservices environment, what problem does a Circuit Breaker pattern primarily address?',
          options: [
            'Ensuring data consistency across distributed databases.',
            'Preventing cascading failures when one service calls another that is temporarily unavailable or slow.',
            'Routing requests to the least loaded service instance.',
            'Aggregating logs from multiple services into a central repository.',
          ],
          correctAnswer: 1,
          explanation:
            "The Circuit Breaker pattern prevents a microservice from repeatedly trying to invoke a failing or slow upstream service. If calls to a service repeatedly fail, the circuit breaker 'trips' (opens), and subsequent calls immediately fail or return a fallback, preventing the failing service from overwhelming the calling service and allowing it time to recover without causing cascading failures.",
          difficulty: 'medium',
          category: 'Microservices',
          usageExample:
            "If an `OrderService` frequently fails to call a `PaymentService`, a circuit breaker would prevent `OrderService` from repeatedly blocking on the failing `PaymentService`, allowing it to return an error or a temporary 'payment pending' status quickly.",
          skills: ['Spring Cloud', 'Circuit Breaker Pattern', 'Resilience4J', 'Resilience'],
        },
        {
          id: `quiz_${baseId}_24`,
          question:
            'Which of the following database indexing strategies is generally most effective for queries involving range searches (e.g., `WHERE amount > 100 AND amount < 500`)?',
          options: ['Full-text index', 'Hash index', 'B-tree index', 'Bitmap index'],
          correctAnswer: 2,
          explanation:
            'B-tree (Balanced Tree) indexes are highly efficient for range queries and ordered scans because they store data in a sorted order and allow for fast traversal between leaf nodes. Hash indexes are excellent for equality lookups but poor for range queries. Full-text indexes are for keyword searches, and bitmap indexes are often used in data warehousing for low-cardinality columns.',
          difficulty: 'medium',
          category: 'Database',
          usageExample:
            "Creating a B-tree index on a `transaction_date` column allows for efficient retrieval of all transactions within a specific date range (`WHERE transaction_date BETWEEN '2023-01-01' AND '2023-01-31'`).",
          skills: ['Database Indexing', 'Query Optimization', 'SQL Performance'],
        },
      ];
      logger.info(`Mock assessment: Generated ${questions.length} questions`);
    } else {
      try {
        questions = await geminiService.generateAssessment(
          {
            title: objectiveDoc['title'],
            description: objectiveDoc['description'],
            category: objectiveDoc['category'],
            targetRole: objectiveDoc['targetRole'],
            currentLevel: objectiveDoc['currentLevel'],
            targetLevel: objectiveDoc['targetLevel'],
          },
          count
        );
      } catch (geminiError) {
        logger.error('Gemini assessment generation failed, using fallback:', geminiError);

        // Fallback to basic questions if Gemini fails
        questions = Array.from({ length: Math.max(3, Math.min(20, count)) }).map((_, i) => ({
          id: `q${i + 1}`,
          question: `Question ${i + 1} about ${objectiveDoc['title']}?`,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 0,
          explanation: 'Sample explanation for learning purposes.',
          difficulty:
            objectiveDoc['targetLevel'] === 'advanced'
              ? 'hard'
              : objectiveDoc['targetLevel'] === 'intermediate'
              ? 'medium'
              : 'easy',
          category: objectiveDoc['category'],
          skills: [objectiveDoc['category']],
        }));
      }
    }

    const now = new Date().toISOString();
    const assessment = {
      userId: uid,
      objectiveId,
      title: `Assessment: ${objectiveDoc['title']}`,
      description: `Skill evaluation for ${objectiveDoc['targetRole']}`,
      category: objectiveDoc['category'],
      skillLevel: objectiveDoc['currentLevel'],
      questions,
      duration: 10,
      createdAt: now,
      status: 'in_progress',
    };

    const id = await firebaseService.createDocument('assessments', assessment);
    return res.status(201).json({ success: true, data: { id, ...assessment } });
  } catch (error) {
    logger.error('Error creating assessment:', error);
    return res.status(500).json({ success: false, message: 'Failed to create assessment' });
  }
});

// Submit assessment answers and compute result
router.post('/:assessmentId/submit', async (req: any, res) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { assessmentId } = req.params as { assessmentId: string };
  const { answers = [], timeSpent = 0 } = req.body as {
    answers: { questionId: string; selectedAnswer: number }[];
    timeSpent?: number;
  };

  const assessment = await firebaseService.getDocument('assessments', assessmentId);
  if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });
  if (assessment['userId'] !== uid)
    return res.status(403).json({ success: false, message: 'Forbidden' });

  const correctMap = new Map<string, number>(
    assessment['questions'].map((q: any) => [q.id, q.correctAnswer])
  );
  let correctAnswers = 0;
  for (const a of answers) {
    if (correctMap.get(a.questionId) === a.selectedAnswer) correctAnswers++;
  }

  const totalQuestions = assessment['questions'].length;
  const score = Math.round((correctAnswers / totalQuestions) * 100);
  let skillLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
  if (score >= 80) skillLevel = 'advanced';
  else if (score >= 60) skillLevel = 'intermediate';

  const result = {
    userId: uid,
    assessmentId,
    objectiveId: assessment['objectiveId'],
    score,
    totalQuestions,
    correctAnswers,
    timeSpent,
    completedAt: new Date().toISOString(),
    skillLevel,
    recommendations:
      score >= 80
        ? ['Proceed to advanced modules']
        : score >= 60
        ? ['Reinforce intermediate topics']
        : ['Focus on fundamentals'],
  };

  const resultId = await firebaseService.createDocument('assessmentResults', result);
  await firebaseService.updateDocument('assessments', assessmentId, { status: 'completed' });
  // Persist last assessment summary onto objective for quick display
  try {
    await firebaseService.updateDocument('objectives', assessment['objectiveId'], {
      lastAssessment: {
        score,
        skillLevel,
        completedAt: result.completedAt,
      },
    });
  } catch {}
  return res.json({ success: true, data: { id: resultId, ...result } });
});

// Get assessment result
router.get('/results/:resultId', async (req: any, res) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const { resultId } = req.params as { resultId: string };
  const data = await firebaseService.getDocument('assessmentResults', resultId);
  if (!data) return res.status(404).json({ success: false, message: 'Not found' });
  if (data['userId'] !== uid) return res.status(403).json({ success: false, message: 'Forbidden' });
  return res.json({ success: true, data: { id: resultId, ...data } });
});

export default router;
