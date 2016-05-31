export default
/*@ngInject*/
function aKeywordModel($resource, ANALYTICS_API) {
  var resource = $resource(ANALYTICS_API + '/keywords/:_id/:method', {
    '_id': '@_id'
  }, {
    'get': {method: 'GET'},
    'save': {method: 'PUT'},
    'create': {method: 'POST'},
    'update': {method: 'PATCH'},
    'analytics': {method: 'GET', params : {pageId: '@pageId', dateFrom: '@dateFrom', dateTo: '@dateTo', method: 'pageAnalytics' }, isArray: true}
  });

  return resource;
}
