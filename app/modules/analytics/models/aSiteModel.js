export default
/*@ngInject*/
function aSiteModel($resource, ANALYTICS_API) {
  var resource = $resource(ANALYTICS_API + '/sites/:_id/:method', {
    '_id': '@_id'
  }, {
    'get': {method: 'GET'},
    'save': {method: 'PUT'},
    'create': {method: 'POST'},
    'update': {method: 'PATCH'},

    'updateSite': {method: 'PUT'},
    'scanSite': {method: 'POST', params: { method: 'scan' }},

    'find': {method: 'POST', params: { method: 'find' }, isArray: true }
  });

  return resource;
}
