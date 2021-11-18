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

  const { szamName, szcontrolSetid, szcontrol, statusCode, szObjectKey } = event;

  var jsonReturn = {
    'statusCode': 500,
    'szMsg': 'Error has occured'
  };

  if (statusCode != 200) {
    //bail right now
    return jsonReturn;
  }

  jsonReturn = {
    'statusCode': 404,
    'szMsg': 'Assessment, control sets, and control combination not found'
  };
  // continue




  console.log("List start:" + szamName + "<===>" + szcontrolSetid + "<===>" + szcontrol + "======" + statusCode);

  var uuidAssessmentID = null;
  
  var uuidControlID = null;
  //var szcontrolSetId =null;



  var structAssessParams = {
    maxResults: 150 /* required param field */
  };



  /**
   * We locate the assessment just so we can print it...but we don't need to.
   */
  const objAssessmentlist = await auditmanager.listAssessments(structAssessParams).promise();


  for (i in objAssessmentlist.assessmentMetadata) {
    // console.log(objAssessmentlist.assessmentMetadata[i].name);
    //  console.log(objAssessmentlist.assessmentMetadata[i].id);

    if (objAssessmentlist.assessmentMetadata[i].name == szamName) {
       console.log("We Matched assessment:" + szamName);
      uuidAssessmentID = objAssessmentlist.assessmentMetadata[i].id;
      var structAssessParams = {
        assessmentId: objAssessmentlist.assessmentMetadata[i].id /* required param field */
      };

      const objAssessment = await auditmanager.getAssessment(structAssessParams).promise();

      for (j in objAssessment.assessment.framework.controlSets) {
       //   console.log(objAssessment.assessment.framework.controlSets[j].id);

        if (objAssessment.assessment.framework.controlSets[j].id == szcontrolSetid) {
           console.log("We Matched controlset:" + szcontrolSetid);
          // console.log(objAssessment.assessment.framework.controlSets[j]);

          for (k in objAssessment.assessment.framework.controlSets[j].controls) {
            // console.log(objAssessment.assessment.framework.controlSets[j].controls[k].name);

            if (objAssessment.assessment.framework.controlSets[j].controls[k].name == szcontrol) {
               console.log("WE matched control=" + szcontrol);
              uuidControlID = objAssessment.assessment.framework.controlSets[j].controls[k].id;
            }

          }


        }
      }

    }
  }

  if (uuidAssessmentID != null && uuidControlID != null) {
    console.log("We got the UUIDs:" + uuidAssessmentID + "<===>" + uuidControlID);

    jsonReturn = {
      'statusCode': 200,
      'szAssessmentID': uuidAssessmentID,
      'szcontrolSetid': szcontrolSetid,
      'szcontrol': uuidControlID,
      'szObjectKey': szObjectKey,
      'szMsg': 'continue'

    }
  }


  //==========================================


  console.log("Assessment end ===================");
  return jsonReturn;
};
