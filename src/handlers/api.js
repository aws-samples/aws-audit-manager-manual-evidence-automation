/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

const awssdk = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const parser = require('lambda-multipart-parser');
const sf = new awssdk.StepFunctions();
const s3 = new awssdk.S3();

let szStMachineArn = process.env.envStateMachineArn;
let szBucketName = process.env.envStorageBucketName;
//let szKMSkeyid = process.env.envKMSid;

/**
 * processes API  message
 */
exports.handler = async(event, context) => {

    var objReturn = {
        statusCode: 500,

        headers: {

            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Origin": "*"

        }
    };

    var szFileUUID = uuidv4();
    const objParsedResponse = await parser.parse(event);
   // console.log(objParsedResponse);
    console.log(objParsedResponse.AssessmentName);
    console.log(objParsedResponse.ControlSetName);
    console.log(objParsedResponse.ControlIdName);
    console.log(objParsedResponse.files[0].fieldname);
    console.log(Buffer.isBuffer(objParsedResponse.files[0].content));
    console.log(Array.isArray(objParsedResponse.files[0].content));
    
    if((objParsedResponse.AssessmentName === undefined ) || (objParsedResponse.ControlSetName === undefined) || (objParsedResponse.ControlIdName === undefined) || (objParsedResponse.files[0].fieldname === undefined) ){
        
        //missing parameters
        console.log("Missing parameters");
        return objReturn;
    }

    /**
     * Time to do push into S3
     */

    try {

        var s3Params = {
            Body: objParsedResponse.files[0].content,
            Bucket: szBucketName,
            //  ContentType: objParsedResponse.files[0].contentType,
            ServerSideEncryption: 'aws:kms',
            Key: objParsedResponse.AssessmentName + "/" + szFileUUID + "-" + objParsedResponse.files[0].filename
        };

        var respObj = await s3.putObject(s3Params).promise();

    }
    catch (error) {

        console.log(respObj);
        console.log(error);
        //let's immediatly bail
        return objReturn;

    }

    /**
     * We have everything we need to prep the statefunction initiatlization 
     */
    var szFullObjectKeyPath = "s3://" + szBucketName + "/" + objParsedResponse.AssessmentName + "/" + szFileUUID + "-" + objParsedResponse.files[0].filename;
    // console.log(szFullObjectKeyPath);

    const objMachinePayload = {
        'statusCode': 200,
        'szamName': objParsedResponse.AssessmentName,
        'szcontrolSetid': objParsedResponse.ControlSetName,
        'szcontrol': objParsedResponse.ControlIdName,
        'szObjectKey': szFullObjectKeyPath,
        'szMsg': 'continue'
    };

    var params = {
        stateMachineArn: szStMachineArn,
        /* required */
        input: JSON.stringify(objMachinePayload)
    };


    console.log(params);
    const objResult = await sf.startExecution(params).promise();

    /**
     * Return Message
     */

    if (objResult.hasOwnProperty("executionArn")) {
        console.log(objResult);

        objReturn = {
            statusCode: 200,
            // body: { started: objResult.startDate },
            headers: {

                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": "*"

            }
        };

    }
    else {
        console.log(objResult);

        objReturn = {
            statusCode: 500,
            body: { error: 'Endpoint error' },
            headers: {
                'Content-Type': 'application/json',
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": "*"

            }
        };
    }
 //   console.log(event);
    return objReturn;

};
