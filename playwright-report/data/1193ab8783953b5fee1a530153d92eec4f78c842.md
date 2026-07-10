# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: marketplace-flow.spec.ts >> E2E Marketplace Flow >> Complete Flow: Broker posts load -> Carrier requests -> Broker approves -> Carrier delivers
- Location: e2e\marketplace-flow.spec.ts:48:7

# Error details

```
Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - button [ref=e4]:
        - img [ref=e5]
      - link "A America Dispatch" [ref=e8] [cursor=pointer]:
        - /url: /dashboard
        - generic [ref=e9]: A
        - generic [ref=e10]: America Dispatch
      - navigation [ref=e11]:
        - link "Dashboard" [ref=e12] [cursor=pointer]:
          - /url: /dashboard
          - img [ref=e14]
          - generic [ref=e19]: Dashboard
        - link "Requests" [ref=e20] [cursor=pointer]:
          - /url: /broker-requests
          - img [ref=e22]
          - generic [ref=e25]: Requests
        - link "Loadboard" [ref=e26] [cursor=pointer]:
          - /url: /loadboard
          - img [ref=e28]
          - generic [ref=e30]: Loadboard
        - link "Post Load" [ref=e31] [cursor=pointer]:
          - /url: /new-load
          - img [ref=e33]
          - generic [ref=e37]: Post Load
        - link "My Loads" [ref=e38] [cursor=pointer]:
          - /url: /my-loads
          - img [ref=e40]
          - generic [ref=e45]: My Loads
        - link "Account" [ref=e46] [cursor=pointer]:
          - /url: /account
          - img [ref=e48]
          - generic [ref=e51]: Account
        - link "Settings" [ref=e52] [cursor=pointer]:
          - /url: /settings
          - img [ref=e54]
          - generic [ref=e57]: Settings
      - button "Logout" [ref=e60]:
        - img [ref=e61]
        - generic [ref=e64]: Logout
    - main [ref=e65]:
      - generic [ref=e66]:
        - button [ref=e70]:
          - img [ref=e71]
        - generic [ref=e75]:
          - generic [ref=e76]:
            - heading "Carrier Requests" [level=1] [ref=e77]:
              - img [ref=e78]
              - text: Carrier
              - generic [ref=e81]: Requests
            - paragraph [ref=e82]: Review and approve carrier requests to book your loads.
          - generic [ref=e83]:
            - img [ref=e84]
            - heading "No pending requests" [level=3] [ref=e87]
            - paragraph [ref=e88]: When carriers request to book your loads, they will appear here for your approval.
  - alert [ref=e89]
```