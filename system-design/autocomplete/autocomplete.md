# Normalized query

In an Autocomplete System, a normalized query means transforming the user's search input into a consistent, standardized format before using it as a key in the cache.

The primary purpose is to improve cache hit rates and avoid redundant API requests.

### 1. Example

Imagine a user searches for these three queries:

| User input        | Normalized query |
| ----------------- | ---------------- |
| `"React"`         | `"react"`        |
| `"  react  "`     | `"react"`        |
| `"REACT"`         | `"react"`        |
| `"React   Hooks"` | `"react hooks"`  |

All these queries can be normalized to the same cache key.

Without normalization, your cache might store four separate entries, even though they could produce identical suggestions.

With normalization, you only need one entry.

### 2. Implementation in JavaScript

```
function normalizeQuery(query) {
  return query
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

normalizeQuery(" React   Hooks ");
// "react hooks"

normalizeQuery("REACT HOOKS");
// "react hooks"
```

### 3. How it works in your autocomplete architecture

Consider the user typing `"  React  "`.

Input UI

" React "

Controller

normalizeQuery(" React ") → "react"

Query Cache Lookup

cache.get("react")

Cache hit

Return cached suggestions

Cache miss

Fetch suggestions from API and cache them

### 4. Important system design consideration

Normalization must respect your search API's behavior.

For example, if your backend supports case-sensitive searches, converting everything to lowercase might change the search semantics.

Additionally, if suggestions depend on language, country, or filters, those parameters should be part of the cache key.

```
const cacheKey = JSON.stringify({
  query: normalizeQuery(query),
  locale: "en-IN",
  category: "products",
});
```

This prevents accidentally returning results cached for a different context.

Interview takeaway: Query normalization is a cache optimization technique that ensures semantically equivalent search queries share the same cache entry, improving cache hit rates, reducing duplicate network requests, and making autocomplete more responsive.

One distinction worth remembering: normalization and debouncing solve different problems. Normalization avoids redundant requests for equivalent queries, while debouncing reduces how frequently requests are initiated as the user types.

# Server API

```
type Result = {
  id: string;
  text: string;
  value?: string;
  type?: string;
};

type SuggestionsResponse<TItem extends Result = Result> = {
  items: TItem[];
  nextCursor?: string;
};

type GetSuggestions<TItem extends Result = Result> = (options: {
  query: string;
  limit: number;
  cursor?: string;
  signal: AbortSignal;
}) => Promise<SuggestionsResponse<TItem>>;

```

The concept you're looking for is TypeScript Generics, specifically Generic Type Parameters, Generic Constraints, and Default Generic Types.

`TItem` is called a generic type parameter (or type variable).

Let's break down your code.

## 1. What are Generics?

Generics allow you to write reusable types, functions, or classes that work with different types while preserving type safety.

Consider a simple example:

```
function identity<T>(value: T): T {
  return value;
}

identity<string>("Hello"); // string
identity<number>(100);     // number
```

Here:

- `T` is a generic type parameter.
- `<string>` and `<number>` are type arguments.
- TypeScript can also infer `T` from the argument.

Think of `T` as a placeholder for a type that will be supplied later.

## 2. Understanding your code

Let's examine this line:

```
type SuggestionsResponse<TItem extends Result = Result> = {
  items: TItem[];
  nextCursor?: string;
};
```

The final `= Result` (not shown in the diagram) supplies the default generic type.

There are three important concepts:

| Syntax           | Meaning                                                 |
| ---------------- | ------------------------------------------------------- |
| `TItem`          | Generic type parameter                                  |
| `extends Result` | Generic constraint: must satisfy the `Result` structure |
| `= Result`       | Default type if no type argument is provided            |

### A. Generic constraint: `extends Result`

```
type SuggestionsResponse<TItem extends Result> = {
  items: TItem[];
};
```

This means `TItem` must contain at least the required properties of `Result`.

For example:

```
type Product = Result & {
  price: number;
  category: string;
};
```

This is valid:

```
type ProductSuggestions = SuggestionsResponse<Product>;
```

But this is invalid:

```
type User = {
  name: string;
  age: number;
};

type UserSuggestions = SuggestionsResponse<User>;
// TypeScript error: User doesn't satisfy Result.
```

Why? Because `User` doesn't contain the required `id` and `text` properties.

### B. Default generic type: `= Result`

```
type SuggestionsResponse<TItem extends Result = Result>
```

The default means that when you don't explicitly supply a type, TypeScript uses `Result`.

Both of these are equivalent:

```
type A = SuggestionsResponse;

type B = SuggestionsResponse<Result>;
```

However, you can override the default:

```
type C = SuggestionsResponse<Product>;
```

Now `C.items` is an array of `Product`, rather than just `Result`.

## 3. Understanding `GetSuggestions`

```
type GetSuggestions<TItem extends Result = Result> = (options: {
  query: string;
  limit: number;
  cursor?: string;
  signal: AbortSignal;
}) => Promise<SuggestionsResponse<TItem>>;
```

Here, you've defined a generic function type alias.

It represents a function that:

1. Accepts an options object containing `query`, `limit`, `cursor`, and `signal`.
2. Returns a Promise (because fetching suggestions is asynchronous).
3. Resolves to `SuggestionsResponse<TItem>`.

For example:

```
type Product = Result & {
  price: number;
};

const getProducts: GetSuggestions<Product> =
  async ({ query, limit, signal }) => {
    const response = await fetch(
      `/api/products?q=${encodeURIComponent(query)}&limit=${limit}`,
      { signal }
    );

    const data: SuggestionsResponse<Product> =
      await response.json();

    return data;
  };
```

When you consume this function:

```
const response = await getProducts({
  query: "iphone",
  limit: 10,
  signal: new AbortController().signal,
});

response.items[0].id;    // string
response.items[0].text;  // string
response.items[0].price; // number
```

Notice that TypeScript knows `price` exists because the generic `Product` type was passed through the complete type definition.

This is one of the biggest advantages of generics: type information flows from the API definition to the consumer without losing specificity.

## 4. Other TypeScript concepts used in your code

| Concept               | Example                                                    |
| --------------------- | ---------------------------------------------------------- |
| Type alias            | `type Result = {...}`                                      |
| Generics              | `<TItem>`                                                  |
| Generic constraints   | `TItem extends Result`                                     |
| Default generics      | `= Result`                                                 |
| Optional properties   | `value?: string`                                           |
| Array types           | `TItem[]`                                                  |
| Function types        | `(options) => ...`                                         |
| Built-in utility type | `Promise<T>`                                               |
| Structural typing     | `Product` satisfies `Result` by having its required fields |

## 5. One important distinction for interviews

You might confuse `extends` here with inheritance.

```
type Product = Result & {
  price: number;
};
```

Versus:

```
type Response<T extends Result> = {
  items: T[];
};
```

In the first example, `&` creates an intersection type.

In the second example, `extends` defines a constraint on which types can be passed into the generic.

They serve different purposes.

For your frontend system design interview, generics are especially useful when designing reusable components such as Autocomplete, Select, DataTable, Dropdown, and Form controls. The component can operate on a common data structure while preserving additional application-specific fields.

The three things I'd prioritize revising are generics, generic constraints, and type inference. These come up frequently when writing reusable React components in TypeScript.
