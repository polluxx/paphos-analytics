export default
/*@ngInject*/
function($scope, item, project, keywords, aPageModel, NgTableParams, $stateParams, dateService, aKeywordModel, ngAnalyticsService) {

  if(!project.analytics) console.error('No analytics provided! Have you add credentials?');

  project.token = {profile_id: project.analytics !== undefined ? project.analytics.profileId : null};
  project.id = project._id;

  $scope.item = item;
  $scope.project = project;

  console.log(project);
  console.log(item);

  if (!project.analytics) {
    $scope.query.$error= {code: 404, message:"Нет токена авторизации. Авторизируйтесь в сервисе GA."};
    return;
  }

  $scope.$watch(() => ngAnalyticsService.isReady, isReady => {
    if (isReady) {
      if (!project.tokens) return console.error('No tokens provided!');

      ngAnalyticsService.setToken(project.tokens.access_token);
      ngAnalyticsService.authorize();
    }
  });

  $scope.current = {
    site: $scope.item.url,
    date: {
      startDate: dateService.start,
      endDate: dateService.end
    }
  };

  $scope.dateService = dateService;

  $scope.paginationPage = $stateParams.paginationPage;
  $scope.paginationCount = $stateParams.paginationCount;

  $scope.services = ['google', 'yandex'];

  var dates = [], dateFromForKeywords = moment().subtract(5, 'days'), dateToForKeywords = moment();
  for (var date = angular.copy(dateFromForKeywords); date.isSameOrBefore(dateToForKeywords); date.add(1, 'day')) {
    dates.push(date.format('DD.MM.YYYY'))
  }
  $scope.dates = dates;

  $scope.query = {
    ids: 'ga:' + $scope.project.analytics.profileId,
    metrics: 'ga:users',
    dimensions: 'ga:source, ga:date',
    filters: 'ga:pagePath=@' + $scope.item.url,
    type: "plot",
    legend:false,
    colors: [
      // for keywords
      'rgba(148,159,177,1)',
      'rgba(77,83,96,1)'
      // 'rgba(151,187,205,1)',
      // 'rgba(247,70,74,1)',
      // 'rgba(70,191,189,1)',
      // 'rgba(253,180,92,1)',
    ],
    intersections: keywords.map(keyword => keyword.word)
  };

  $scope.$watch(() => dateService, dateServiceChange => {
    aKeywordModel.analytics({pageId: item._id, dateFrom:dateServiceChange.start, dateTo:dateServiceChange.end}, result => {
      $scope.project.keywords = result;
    });
  }, true);

  $scope.keywordsTableParams = new NgTableParams({
    page: 1,
    count: 100,
    sorting: {
      frequency: 'desc'
    }
  }, {
    getData: params => {
      return aKeywordModel.query({
        page: parseInt(params.page()),
        perPage: parseInt(params.count()),
        pageId: item._id,
        dateFrom: dateFromForKeywords,
        dateTo: dateToForKeywords
      }, function (resp, headers) {
        $scope.loading = false;
        $scope.pages = resp;

        params.total(parseInt(headers('x-total-count')));
        return $scope.pages;

      }).$promise;
    }
  });

}
