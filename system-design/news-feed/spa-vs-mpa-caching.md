**Question** : Will client side caching work in case of MPA or it works only for SPA ?

**Answer**: Both SPAs and MPAs support client-side caching. SPAs have an additional practical advantage: their long-lived JavaScript runtime makes it easier to retain in-memory application caches such as TanStack Query across route transitions. MPAs can still achieve effective caching through HTTP headers, browser storage, IndexedDB, and service workers.

The statement "The critical difference is JavaScript runtime persistence, not cache availability" is particularly important when comparing SPA and MPA architectures.

The key idea is that an SPA usually preserves its JavaScript execution environment across route transitions, whereas a traditional MPA creates a new execution environment with every full-page navigation.

Let's understand how this affects caching, application state, and performance.

## 1. JavaScript runtime in SPA vs MPA

### SPA — JavaScript runtime persists

Consider a React SPA using React Router.

When the user first visits `/products`:

1. Browser downloads the initial HTML document.
2. Browser downloads and executes JavaScript bundles.
3. React initializes the application.
4. React Query creates an in-memory cache.
5. React Router manages navigation.

Now imagine the user navigates between pages:

Initial document + JavaScript runtime

React app, router, global stores and API cache

/products

/cart

/profile

Client-side transitions share the same JavaScript runtime

When navigation occurs:

- The browser does not normally reload the HTML document.
- React updates the necessary UI components.
- JavaScript module instances, global variables, and application-level stores can persist.
- React Query's cache can remain available.
- Component-local state persists only if the component remains mounted or its state is stored elsewhere.

For example:

```
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/products" element={<Products />} />
          <Route path="/cart" element={<Cart />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

Suppose `/products` fetches data through React Query.

When the user goes to `/cart` and returns to `/products`, the query cache may still contain the previously fetched products.

Whether another API request occurs depends on settings such as `staleTime`, invalidation, and refetch policies.

Why? The same `QueryClient` instance remains alive throughout these navigations.

## 2. MPA — JavaScript runtime is recreated

Consider a traditional server-rendered MPA.

Page A: `/products`

HTML document A + JS runtime A

Full-page navigation

Page B: `/cart`

HTML document B + JS runtime B

Previous in-memory application state is generally lost

Persistent browser caches and storage remain available

Here's what happens:

1. Browser requests `/products`.
2. Server returns an HTML document.
3. Browser creates a JavaScript execution environment for that document.
4. Application initializes variables, state managers, and caches.
5. User clicks a regular link navigating to `/cart`.
6. Browser loads another document and creates a new JavaScript execution environment.
7. The previous page's in-memory state is generally discarded.

For example:

```
// products.js

let productsCache = {
  products: ["Laptop", "Monitor", "Keyboard"]
};
```

After navigating to `/cart` through a full-page navigation, `productsCache` isn't automatically carried over into the new page's runtime.

Even if both pages download the same JavaScript file, its top-level code typically executes again in the new document.

Important: A cached JavaScript bundle is not the same as a cached JavaScript runtime.

The browser might avoid downloading `products.js` again because of its HTTP cache, but the new page still initializes its own execution environment.

There is one nuance: the browser's Back/Forward Cache (bfcache) may preserve an entire previous document, including its JavaScript heap, when navigating away. If restored from bfcache, that earlier runtime can resume instead of being recreated. This is an optimization, not something an MPA can rely on for all navigations.

## 3. How caching differs in practice

Consider an e-commerce application where users navigate repeatedly between products and their shopping cart.

| Scenario                   | SPA                                     | Traditional MPA                       |
| -------------------------- | --------------------------------------- | ------------------------------------- |
| Navigation                 | Usually no full document reload         | New document loaded                   |
| JavaScript runtime         | Usually persists                        | Usually recreated                     |
| React Query cache          | Can survive route transitions           | Normally reset on full navigation     |
| Redux / Context            | Can survive if provider remains mounted | Reinitialized                         |
| Browser HTTP cache         | Available                               | Available                             |
| `localStorage` / IndexedDB | Available                               | Available                             |
| JS bundles                 | Can remain loaded                       | Can be reused from browser HTTP cache |
| Back/Forward Cache         | Relevant to document navigations        | Can restore previous pages            |

### A practical MPA caching example

Suppose an MPA calls:

```
const response = await fetch("/api/products");
const products = await response.json();
```

The API returns:

```
Cache-Control: private, max-age=300
```

The browser can cache the response for five minutes.

When the user navigates to a different document and requests `/api/products` again, the browser may reuse that HTTP response without sending a new network request.

So the JavaScript runtime is new, but the browser's HTTP cache survives.

This is precisely why caching is not SPA-specific.

One caveat: authenticated or sensitive API responses need appropriately designed caching rules, and some applications deliberately disable HTTP caching for these responses.

## 4. How can an MPA preserve application state?

An MPA has several options.

- HTTP cache: Reuses previously downloaded HTTP responses, subject to caching headers.
- `sessionStorage`: Stores values across same-tab page navigations within the same origin.
- `localStorage`: Persists data across navigations and browser restarts, subject to browser storage policies.
- IndexedDB: Persists larger structured datasets, including application data or offline records.
- Service workers: Intercept network requests and implement custom caching strategies.
- Server-side sessions: Preserve user-associated state across HTTP requests, although this is server-side persistence, not client-side caching.

Notice that service workers and IndexedDB are not mandatory for MPA caching. They are additional tools.

## 5. What this means for frontend system design

For architecture interviews, the distinction is important because an SPA can often rely on a long-lived client-side state layer.

For example, an SPA using React Query can hold fetched results in memory, share them between routes, deduplicate requests, and revalidate stale data.

A traditional MPA cannot assume that the same in-memory cache remains alive across full document navigations. Therefore, it may rely more on HTTP caching, persistent browser storage, or server-side data delivery.

However, persistent runtime does not automatically mean better performance. SPAs can incur substantial JavaScript execution, hydration, and data-fetching costs. MPAs can benefit from server-rendered HTML, optimized HTTP caching, and bfcache.

The right choice depends on navigation patterns, interactivity, SEO requirements, data freshness, and runtime complexity.

## Summary — Notes for frontend system design

- SPA: Initial HTML and JavaScript initialize the application; subsequent client-side route transitions generally preserve the same JavaScript runtime.
- MPA: Each traditional full-page navigation loads a new HTML document and generally creates a new JavaScript runtime.
- Runtime persistence: SPAs can retain global variables, module state, Redux stores, Context providers, and React Query caches across route transitions.
- Component state: In SPAs, component-local state may still be lost when the component unmounts.
- In-memory caching: SPA application caches can survive route transitions. MPA in-memory caches are normally recreated on full-page navigation.
- HTTP caching: Works independently of SPA or MPA architecture. Both can cache HTML, JavaScript, CSS, images, and eligible API responses.
- Persistent storage: `localStorage`, `sessionStorage`, and IndexedDB can preserve data across page navigations in both architectures.
- Service workers: Work with both SPAs and MPAs and support programmable caching strategies such as cache-first, network-first, and stale-while-revalidate.
- JavaScript bundle caching ≠ runtime persistence: A browser may reuse a cached JS file while still executing it in a new runtime.
- bfcache exception: Browsers may preserve an entire document and its JavaScript state for back/forward navigation.
- SSR vs SPA/MPA: SSR determines where initial HTML is generated; it does not by itself determine whether client-side navigation or runtime persistence is supported.
- Key takeaway: The architectural advantage of an SPA is usually the ability to retain a JavaScript runtime and in-memory application state across route transitions, not exclusive access to client-side caching.

Interview-ready explanation: An SPA typically preserves a single JavaScript runtime across client-side navigations, enabling reuse of in-memory state and data caches. A traditional MPA recreates its runtime during full-document navigation, but can still reuse HTTP-cached resources and persistent browser storage. Therefore, runtime lifecycle and caching mechanisms should be considered independently.
