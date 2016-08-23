require('components/stats/stats.tpl')

class StatsController {

  static $inject = [ '$element', '$scope', '$injector' ]

  constructor($element, $scope, $injector) {
    this.$injector = $injector
    let initialize = this.initialize.bind(this, $element, $scope)
    if (this.data) {
      this.data.$promise.then(initialize)
    }

    $scope.$watch('stats.data', (newVal, oldVal) => { if (oldVal != newVal) {
      newVal.$promise.then(initialize)
    }})
  }

  initialize($element, $scope) {
    var options;

    this.parseData()
    this.granularity = this.data.granularity

    if (this.type == 'bar') {
      options = {
        seriesBarDistance: 10,
        reverseData: true,
        horizontalBars: true,
        axisY: {
          offset: 200
        },
        axisX: {
          labelInterpolationFnc: (value, index) => {
            if (value > 1000000 && index % 2 == 0) { return null }
            if (value >= 10000) { return Math.floor(value / 1000) + 'K' }
            return value
          }
        }
      }
    } else {
      options = {
        fullWidth: true,
        axisY: {
          offset: 45,
          labelInterpolationFnc: (value, index) =>
            (value > 10000) ? Math.floor(value / 1000) + 'K' : value
        },
        axisX: {
          labelInterpolationFnc: (value, index) => {
            if (this.granularity == 'HOUR') {
              return value.split(' ')[1]+'H'
            }
            if (this.granularity == 'DAY' && this.parsed.series[0].length > 8) {
              return (parseInt(value.split('-')[2]) % 4 == 1) ?
                value.substr(value.indexOf('-') + 1) : null
            }
            if (this.granularity == 'DAY') {
              return value.substr(value.indexOf('-') + 1)
            }
            if (this.granularity == 'WEEK') {
              return (parseInt(value.split('-')[1]) % 2 == 0) ? value : null
            }
            if (this.granularity == 'MONTH') {
              return (parseInt(value.split('-')[1]) % 3 == 1) ? value : null
            }
            return value
          }
        }
      }
    }
    this.lines = new Chartist[this.type=='bar' ? 'Bar' : 'Line'](
      $element.find('.chartist')[0], this.parsed, options
    )
    this.view = 'graph'

  }

  switchView() {
    this.view = (this.view=='graph') ? 'table' : 'graph'
  }

  parseData() {
    let data = this.data.results
    this.nodata = !data || data.length == 0
    if (this.nodata) { return }
    let serie = data.map(x => x[this.config[1]])
    this.serie = (this.type == 'line') ? [].concat(serie).reverse() : serie
    this.parsed =  {
      labels : data.map(x => x[this.config[0]]),
      series : [ [].concat(serie) ]
    }
  }

}

angular.module('admin_console')
.component('stats', {
  bindings    : {
    data   : '=',
    type   : '=',
    config : '=',
    title  : '='
  },
  controller   : StatsController,
  controllerAs : 'stats',
  templateUrl  : 'components/stats/stats.tpl.html'
})
