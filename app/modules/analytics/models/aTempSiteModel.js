export default
/*@ngInject*/
function aTempSiteModel($resource, ANALYTICS_API) {
  var resource = $resource(ANALYTICS_API + '/tempSites', {
    '_id': '@_id'
  }, {
    'get': {method: 'GET'},
    'save': {method: 'PUT'},
    'create': {method: 'POST'},
    'update': {method: 'PATCH'},
    'delete': {method: 'DELETE'}
  });

  return resource;
}
