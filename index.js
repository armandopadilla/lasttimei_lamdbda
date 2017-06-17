/**
 * LastTimeI lambda
 * Lambda invoked when AWS IoT triggers this lambda for a specific topic
 * which is registered to a button.  The code checks which button was pressed
 * using the serial number and associates the serial number to an action.  The action is then
 * stored in DynamoDB for later use.
 *
 */
const AWS = require('aws-sdk')
const uuidv1 = require('uuid/v1')

const DYNAMODB_TABLE_NAME = 'lasttimei_events'

/**
 * Returns a specific action the user has initiated/completed based off of
 * a buttons serial number
 *
 * @param serialNumber String Serial number provided by the iot button
 * @return String Event associated to the button.
 */
const getAction = (serialNumber) => {
  switch (serialNumber) {
    case 'G030MD027383CRCB':
      return 'ACTION_WASHED_KIDS_BED_SHEETS'
    default:
      return null
  }
}


/**
 * Generate the payload we're going to save into
 * dynamo!
 *
 * @param serialNumber String
 * @param action String
 * @return JSON
 */
const getPayload = (serialNumber, action) => ({
  Item: {
    "id": { S: uuidv1() }, // For true randomness use v4.
    "SerialNumber": { S: serialNumber },
    "Action": { S: action },
    "TimeStamp": { N: Date.now().toString() }
  },
  TableName: DYNAMODB_TABLE_NAME
})


exports.handler = (event, context, callback) => {
  const payload = event

  // Fetch the data
  // Note specific actions are triggered by specific iot buttons.
  // Each button has a unique DSN (serial number).  I'm using that
  // to associate a button to an action.
  const serialNumber = payload.serialNumber

  const action = getAction(serialNumber)
  if (!action) return callback(`serial number, ${serialNumber}, not registered!`)

  // Generate the payload to save into Dynamo!
  const dbSavePayload = getPayload(serialNumber, action)

  const DynamoDB = new AWS.DynamoDB()
  return DynamoDB.putItem(dbSavePayload).promise()
    .then((resp) => callback(null))
    .catch(error => callback(error.message))
}