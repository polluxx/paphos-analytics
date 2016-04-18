export default
/*@ngInject*/
function aExperimentUrlModel($resource, ANALYTICS_API) {
  var resource = $resource(ANALYTICS_API + '/experimentUrls/:_id/:method', {
    '_id': '@_id'
  }, {
    'get': {method: 'GET'},
    'save': {method: 'PUT'},
    'create': {method: 'POST'},
    'update': {method: 'PATCH'}
  });

  return resource;
}
