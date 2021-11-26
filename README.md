# AWS Audit Manager Manual Evidence Automation

## Background 

Organizations in regulated industries must balance regulatory compliance and audit processes with their accelerated software delivery capabilities. AWS Audit Manager supports this effort by automatically collecting evidence and enabling regular assessments of AWS Account configurations. Data can be automatically collected from AWS Config, AWS Security Hub, and AWS CloudTrail. In addition to this automatically collected data, the assessments and their accompanying reports can be augmented with manually uploaded *evidence*.

Examples of this manual evidence include, but are not limited to:

1. SDLC approval process documentation
1. Change control records
1. Regulatory process documentation

This solution provides a means to automatatically connect a manual evidence generation process to AWS Audit Manager. It does this through the deployment of an API endpoint as a frontend to an example automation workflow that associates documentary evidence to an AWS Audit Manager Assessment. 


## How this Solution Works

This solution creates an HTTPS API Endpoint which allows integration with other Software Delivery Life Cycle (SDLC) solutions,  IT service management (ITSM) products, and CTMS (Clinical Trial Management System) solutions to capture trial process change amendment documentation. In this solution’s current form, you can submit an evidence file payload along with the assessment and control details to the API and this solution will tie all the information together for the audit report.

The architecture is composed of the following components:

* An [Amazon API Gateway](https://aws.amazon.com/api-gateway/) endpoint and **API Key** 
* An [AWS Lambda](https://aws.amazon.com/lambda/) function implementing the API 
* An [AWS Step Function](https://aws.amazon.com/step-functions) Standard Workflow composed of various **AWS Lambda functions** that will update **Audit Manager Assessments**
* An [Amazon S3](https://aws.amazon.com/s3/) Bucket where evidence is stored
* An [AWS Key Management Service](https://aws.amazon.com/kms/) Key to encrypt evidence in S3
* An [Amazon SNS](https://aws.amazon.com/sns/) Topic that can be subscribed to by third-party solutions for notifications


![image of Architecture!](./docs/EvidenceArchitecture.png)


Example invocation for an assessment named `GxP21cfr11` via curl:  

```
curl --location --request POST 'https://<YOURAPIENDPOINT>.execute-api.<AWS REGION>.amazonaws.com/Prod' \
--header 'x-api-key: <API KEY>' \
--form 'payload=@"<PATH TO FILE>"' \
--form 'AssessmentName="GxP21cfr11"' \
--form 'ControlSetName="General requirements"' \
--form 'ControlIdName="11.100(a)"'
```

1. This API uses an (`x-api-key`) to track usage
    1. The API key is used to track and control usage by clients
    2. To truly secure this endpoint consider using IAM authentication  ( described in a later section) among other [documented methods](https://docs.aws.amazon.com/apigateway/latest/developerguide/rest-api-protect.html).
1. The form post content:
    - AssessmentName : Name for the assessment in the Audit Manager GUI, `GxP21cfr11` as an example
    - ControlSetName : Display name for a control set within an assessment, `General requirements` as an example
    - ControlIdName : A particular control within a control set, `11.100(a)` as an example
    - payload : file content


The file content will be placed in the S3 bucket in a folder that matches the assessment name, the file name is pre-pended with a UUID to prevent collisions. 


### The AWS Step Function State Machine

![image of State Machine!](./docs/stepfunction.png)

- The state machine takes the following input:
    - Assessment Name
    - Control Set Name
    - Control Name
    - Valid S3 object path where additional evidence resides

- If the control is found, the Step Function will update Audit Manager with the additional evidence
- Sends a notification via Amazon Simple Notification Service
    - Notification on Success or Failure
    - Allows connecting to other systems

### IAM Protect API Gateway

You can additionally protect this solution by using AWS IAM authentication/authorization for invoking the API Gateway. This is enabled by a overriding the default value for the parameter `paramUseIAMwithGateway` at deployment time. You can read about this capability [here](https://aws.amazon.com/premiumsupport/knowledge-center/iam-authentication-api-gateway/) and [here](https://docs.aws.amazon.com/apigateway/latest/developerguide/permissions.html).  This solution also deploys an example managed policy to attach to roles/groups/users if needed. 

## Build and Deploy Sample Solution

This project contains source code and supporting files for a serverless application that you can deploy with the AWS Serverless Application Model (AWS SAM) command line interface (CLI). It includes the following files and folders:

- `src` - Code for the application's Lambda implementation of Step Functions. Also includes a step function definition file.
- `template.yml` - A template that defines the application's AWS resources.

Resources for this project are defined in the `template.yml` file in this project. You can update the template to add AWS resources through the same deployment process that updates your application code.


### Pre-requisites

The AWS SAM CLI is an extension of the AWS CLI that adds functionality for building and testing Lambda applications. It uses Docker to run your functions in an Amazon Linux environment that matches Lambda. It can also emulate your application's build environment and API.

To use the AWS SAM CLI, you need the following tools:

* AWS SAM CLI - [Install the AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html).
* Node.js - [Install Node.js 14](https://nodejs.org/en/), including the npm package management tool.
* Docker - [Install Docker community edition](https://hub.docker.com/search/?type=edition&offering=community).


### First Time Build and Deploy

To build and deploy your application for the first time:

1. `git clone` this repo
1. ` cd ` into the cloned repo folder
1.  Run the following in your AWS SAM shell. **You will need a unique S3 Bucketname. This solution will create the bucket**

```
sam build
sam deploy --guided --parameter-overrides paramBucketName=[A unique none existent bucketname]
```

The first command will build the source of your application. The second command will package and deploy your application to AWS, with a series of prompts. For the prompts, use the region where AWS Audit Manager was configured. Provide a unique application name. Use default values otherwise.  

To activate the IAM authentication feature for API gateway, override the default value with the following:
```
paramUseIAMwithGateway=AWS_IAM
```

## Clean Up

To clean up
- Delete content in S3 Bucket
- Delete the CloudFormation stack associated with this solution

