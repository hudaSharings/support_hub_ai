## **Final kata** **Start Date: Apr 14, 2026** **End Date: Apr 21, 2026**

## **Technical Customer Support Resolution System for GitHub.com**

### **Purpose**

Build a multi-agent technical customer support system for GitHub.com.

The system should take an incoming support issue, gather the right evidence, use the right tools, and decide whether the case should be resolved, clarified, or escalated.

This assignment is intended to assess depth across retrieval-augmented generation, multi-agent workflows, tool use, MCP, orchestration, and technical support reasoning.

---

## **Assignment Brief**

GitHub.com support teams handle a wide range of cases, including billing questions, plan confusion, feature access disputes, token failures, API issues, rate limit complaints, and SAML SSO problems.

Some cases can be resolved from documentation. Others require account or case-specific context. Some require careful troubleshooting. Some require escalation.

Your task is to build an AI-powered support application that assists with this process.

The application should:

* understand the issue  
* retrieve relevant information from documentation  
* use tools where needed  
* distinguish between documentation-backed knowledge and case-specific reasoning  
* decide the next best action  
* generate a clear support outcome

This is not a generic chatbot exercise. It is a technical support resolution system.

---

## **What You Are Building**

You are building an application for an internal support team.

A support agent provides a customer issue. Your system should then:

* analyze the issue  
* gather relevant evidence  
* determine the likely problem area  
* use documentation and tools appropriately  
* decide whether to resolve, clarify, or escalate  
* generate a usable support response

Your implementation must use:

* a multi-agent design  
* RAG over a GitHub Docs corpus  
* tool use  
* MCP for part of the tool layer

How you implement these is up to you. 

---

## **Scope**

Your system should support cases in areas such as:

* GitHub plans  
* billing and plan changes  
* billing-related access issues  
* feature access and entitlement disputes  
* personal access token issues  
* authentication and authorization problems  
* REST API failures  
* rate limiting  
* SAML SSO issues  
* organization or enterprise access issues  
* repeated unresolved cases  
* escalation workflows

---

## **Mandatory Requirements**

Your solution must include all of the following:

* multi-agent support workflow  
* RAG over a GitHub Docs corpus  
* tool use  
* MCP-based integration for part of the tool layer  
* support for all required scenarios in this brief  
* support for all three outcomes:  
  * resolve  
  * clarify  
  * escalate  
* clear evidence for why a conclusion was reached  
* customer-facing response  
* internal support note

You are free to choose the implementation approach, framework, storage model, and agent design.

---

## **Inputs Included in This Assignment**

This assignment starts from a fixed set of inputs.

You are being given:

* a documentation corpus seed list  
* a business entity model  
* required support scenarios

You are not being given a prebuilt backend, schema, or completed support flow. Part of the exercise is deciding how to represent and use the information needed by your system.

---

## **Documentation Corpus Seed List**

Use the following GitHub Docs URLs as the starting point for your retrieval corpus.

You may ingest them directly, snapshot them, convert them to markdown or PDF, or otherwise normalize them for your solution.

[https://docs.github.com/en/get-started/learning-about-github/githubs-plans](https://docs.github.com/en/get-started/learning-about-github/githubs-plans)   
[https://docs.github.com/en/get-started/using-github-docs/about-versions-of-github-docs](https://docs.github.com/en/get-started/using-github-docs/about-versions-of-github-docs) 

[https://docs.github.com/en/billing](https://docs.github.com/en/billing)   
[https://docs.github.com/en/billing/get-started/how-billing-works](https://docs.github.com/en/billing/get-started/how-billing-works)   
[https://docs.github.com/en/billing/how-tos/manage-plan-and-licenses](https://docs.github.com/en/billing/how-tos/manage-plan-and-licenses)   
[https://docs.github.com/billing/managing-the-plan-for-your-github-account/upgrading-your-accounts-plan](https://docs.github.com/billing/managing-the-plan-for-your-github-account/upgrading-your-accounts-plan)   
[https://docs.github.com/en/billing/how-tos/manage-plan-and-licenses/downgrade-plan](https://docs.github.com/en/billing/how-tos/manage-plan-and-licenses/downgrade-plan)   
[https://docs.github.com/en/billing/how-tos/troubleshooting](https://docs.github.com/en/billing/how-tos/troubleshooting) 

[https://docs.github.com/en/rest](https://docs.github.com/en/rest)   
[https://docs.github.com/en/rest/quickstart](https://docs.github.com/en/rest/quickstart)   
[https://docs.github.com/en/rest/using-the-rest-api/getting-started-with-the-rest-api](https://docs.github.com/en/rest/using-the-rest-api/getting-started-with-the-rest-api)   
[https://docs.github.com/en/rest/authentication/authenticating-to-the-rest-api](https://docs.github.com/en/rest/authentication/authenticating-to-the-rest-api)   
[https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)   
[https://docs.github.com/en/rest/using-the-rest-api/troubleshooting-the-rest-api](https://docs.github.com/en/rest/using-the-rest-api/troubleshooting-the-rest-api) 

[https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)   
[https://docs.github.com/authentication/authenticating-with-saml-single-sign-on](https://docs.github.com/authentication/authenticating-with-saml-single-sign-on)   
[https://docs.github.com/github/authenticating-to-github/authenticating-with-saml-single-sign-on/authorizing-a-personal-access-token-for-use-with-saml-single-sign-on](https://docs.github.com/github/authenticating-to-github/authenticating-with-saml-single-sign-on/authorizing-a-personal-access-token-for-use-with-saml-single-sign-on) 

[https://docs.github.com/en/organizations/managing-programmatic-access-to-your-organization/setting-a-personal-access-token-policy-for-your-organization](https://docs.github.com/en/organizations/managing-programmatic-access-to-your-organization/setting-a-personal-access-token-policy-for-your-organization)   
[https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-programmatic-access-to-your-organization/managing-requests-for-personal-access-tokens-in-your-organization](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-programmatic-access-to-your-organization/managing-requests-for-personal-access-tokens-in-your-organization) 

[https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-saml-single-sign-on-for-your-organization](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-saml-single-sign-on-for-your-organization)   
[https://docs.github.com/enterprise-cloud@latest/organizations/managing-saml-single-sign-on-for-your-organization/troubleshooting-identity-and-access-management-for-your-organization](https://docs.github.com/enterprise-cloud@latest/organizations/managing-saml-single-sign-on-for-your-organization/troubleshooting-identity-and-access-management-for-your-organization) 

[https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/using-saml-for-enterprise-iam/configuring-saml-single-sign-on-for-your-enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/using-saml-for-enterprise-iam/configuring-saml-single-sign-on-for-your-enterprise)   
[https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/using-saml-for-enterprise-iam/troubleshooting-saml-authentication](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/using-saml-for-enterprise-iam/troubleshooting-saml-authentication)   
[https://docs.github.com/enterprise-cloud@latest/admin/identity-and-access-management/using-saml-for-enterprise-iam/saml-configuration-reference](https://docs.github.com/enterprise-cloud@latest/admin/identity-and-access-management/using-saml-for-enterprise-iam/saml-configuration-reference)   
---

## **Business Entities**

Your system should be designed around the following business entities. You may model them however you choose.

### **Customer**

Represents the customer account or business relationship.

Possible fields may include:

* customer\_id  
* customer\_name  
* region  
* support\_tier  
* status

### **GitHub Organization**

Represents an organization on GitHub.com.

Possible fields may include:

* org\_id  
* org\_name  
* customer\_id  
* enterprise\_id  
* current\_plan  
* billing\_status  
* sso\_enabled

### **Enterprise Account**

Represents an enterprise-level account that may govern one or more organizations.

Possible fields may include:

* enterprise\_id  
* enterprise\_name  
* support\_tier  
* saml\_enabled  
* account\_status

### **Subscription**

Represents plan and subscription state.

Possible fields may include:

* subscription\_id  
* scope\_type  
* scope\_id  
* plan\_name  
* billing\_cycle  
* renewal\_date  
* active\_status  
* pending\_change

### **Invoice**

Represents billing and payment state.

Possible fields may include:

* invoice\_id  
* customer\_id  
* billing\_period  
* amount  
* currency  
* payment\_status  
* due\_date

### **Entitlement**

Represents whether a feature is available for a given account, organization, or enterprise.

Possible fields may include:

* entitlement\_id  
* scope\_type  
* scope\_id  
* feature\_name  
* enabled  
* source

### **Token Record**

Represents a PAT or other authentication-related record.

Possible fields may include:

* token\_id  
* token\_type  
* owner  
* org\_id  
* permissions  
* sso\_authorized  
* expiration\_date  
* revoked

### **SAML Configuration**

Represents SAML-related setup for an organization or enterprise.

Possible fields may include:

* saml\_config\_id  
* org\_id\_or\_enterprise\_id  
* enabled  
* idp\_name  
* certificate\_expiry  
* last\_validated

### **API Usage**

Represents request volume and rate limit related information.

Possible fields may include:

* usage\_id  
* org\_id\_or\_user\_id  
* api\_type  
* time\_window  
* request\_count  
* throttled\_requests

### **Support Case**

Represents the support issue itself.

Possible fields may include:

* case\_id  
* customer\_id  
* org\_id  
* title  
* description  
* severity  
* status  
* issue\_category

### **Case History**

Represents prior support interactions for the same customer, organization, or issue type.

Possible fields may include:

* event\_id  
* case\_id  
* event\_type  
* actor  
* timestamp  
* notes

### **Service Status**

Represents current or recent service health.

Possible fields may include:

* service\_status\_id  
* component  
* region  
* status  
* incident\_id  
* updated\_at

### **Incident**

Represents a known platform issue.

Possible fields may include:

* incident\_id  
* title  
* severity  
* affected\_services  
* start\_time  
* end\_time  
* status

---

## **Tool Expectations**

Your system should include tools that support case resolution.

At a minimum, your system should support capabilities such as:

* retrieving customer or organization context  
* checking plan or subscription state  
* checking feature entitlements  
* checking token or authentication state  
* looking up prior case history  
* checking service or incident status  
* creating an escalation artifact

The exact design is up to you, but these capabilities must exist.

At least part of the tool layer must use MCP.

---

## **Types of Queries the System Should Support**

Your system should be able to handle support requests such as:

### **Plan and Billing**

* What plan is this organization on?  
* Why are paid features locked?  
* Is there a billing issue affecting access?  
* What changes if the customer downgrades?  
* Has a recent upgrade actually taken effect?

### **Entitlements**

* Does this organization have access to feature X?  
* Is the feature unavailable because of plan level?  
* Is the issue a product limitation or an account-specific issue?

### **Authentication and Tokens**

* Why is this personal access token failing?  
* Does this token need SSO authorization?  
* Is the token expired, revoked, or missing permissions?  
* Is an organization policy blocking the token?

### **REST API**

* Why are these API requests failing?  
* Is this an authentication issue?  
* Is this a permissions issue?  
* Is this a rate-limit issue?

### **SAML / Identity**

* Why is SAML SSO failing?  
* Is this likely a configuration issue?  
* Is the issue at organization scope or enterprise scope?  
* Should this issue be escalated?

### **Case Handling**

* Has this happened before?  
* Does the case history suggest escalation?  
* Is there enough information to proceed?  
* What additional information is needed?

---

## **Required Scenarios**

Your system must be able to handle the following scenarios.

### **Scenario 1: Feature entitlement dispute**

A customer claims their organization should have access to a feature, but the product does not show it as available.

### **Scenario 2: Paid features locked**

A customer reports that paid functionality is unavailable even though they believe they are on a paid plan.

### **Scenario 3: PAT failing for organization resources**

A developer says their PAT works in some contexts but fails when accessing organization resources.

### **Scenario 4: REST API rate limit complaint**

A customer believes GitHub is failing, but the problem may actually be caused by rate limiting.

### **Scenario 5: SAML SSO login failure**

An organization reports that users cannot authenticate through SAML SSO.

### **Scenario 6: Repeated unresolved authentication issue**

Case history shows repeated unsuccessful attempts to resolve a token or SSO-related issue.

### **Scenario 7: Ambiguous complaint**

A customer says, “GitHub is broken for our org,” without enough detail to proceed.

### **Scenario 8: Billing plus technical issue**

A customer reports a billing issue and a loss of access that is now impacting automation or API workflows.

---

## **Expected Output**

For each support case, your system should produce a clear and consistent result that includes:

* the likely issue type  
* the evidence used from documentation  
* the tools used  
* the important findings  
* whether the result is resolve, clarify, or escalate  
* a customer-facing response  
* an internal support note

You may choose the exact format, but it should be easy to review and compare across scenarios.

---

## **Deliverables**

Please submit:

* source code  
* setup instructions  
* README  
* a short design note  
* instructions for ingesting the documentation corpus  
* instructions for running the scenarios  
* outputs for the required scenarios  
* a short summary of limitations and next improvements

---

## **Evaluation Criteria**

Your submission will be evaluated on the following dimensions.

### **RAG Quality**

* relevance of retrieved information  
* effective use of the GitHub Docs corpus  
* grounding of conclusions in documentation

### **Multi-Agent Quality**

* meaningful use of multiple agents  
* sensible case flow  
* appropriate handling of resolve, clarify, and escalate

### **Tool Use**

* correct use of tools  
* correct use of business entities  
* ability to combine tool output with retrieved evidence

### **MCP Usage**

* real use of MCP in the system  
* sensible integration of MCP-backed tools

### **Support Reasoning**

* quality of the resolution logic  
* ability to avoid unsupported assumptions  
* quality of the generated support response

### **Implementation Quality**

* clarity  
* completeness  
* reproducibility  
* overall usability

---

## **Constraints**

You may use:

* any language  
* any framework  
* any database or storage model  
* any vector store  
* AI-assisted development tools

You may not:

* skip multi-agent design  
* skip MCP  
* hardcode scenario answers  
* treat the assignment as only a document chatbot  
* rely only on documentation for case-specific decisions

