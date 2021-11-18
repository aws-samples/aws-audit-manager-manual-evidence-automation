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
const auditmanager = new awssdk.AuditManager();
let response;

/**
 *
 * 
 */
exports.lambdaHandler = async (event, context) => {

    console.log("Evidence Insert Start ===================");

    const { statusCode, szAssessmentID, szcontrolSetid, szcontrol, szObjectKey } = event;

    var structManaulUpdateEvidenceParams = {
        assessmentId: szAssessmentID, /* required */
        controlId: szcontrol, /* required */
        controlSetId: szcontrolSetid, /* required */
        manualEvidence: [
            {
                s3ResourcePath: szObjectKey
            }
        ]
    };

    console.log(structManaulUpdateEvidenceParams);
    /**
     * Now that we got everything we need to update the control on the assessment we can now add the manual evidence
     */
    try {
        const objEvidenceResults = await auditmanager.batchImportEvidenceToAssessmentControl(structManaulUpdateEvidenceParams).promise();

        if (objEvidenceResults.errors.length == 0) {
            //this is what we want 
            response = {
                'statusCode': 200,
                'szMsg': 'Success'
            }

        } else {
            response = {
                'statusCode': 500,
                'szMsg': JSON.stringify(objEvidenceResults.errors)
            }
        }


    } catch (error) {
        response = {
            'statusCode': 500,
            'szMsg': error.message

        }
    }


  //  console.log(objEvidenceResults);

    console.log("Auto Evidence Insert End ===================");
    return response;
};
