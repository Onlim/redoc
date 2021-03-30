import React, { Component } from 'react';
import './RedocPage.css';
import Logo from '../logo.png';
import { RedocStandalone, Loading, RedocNormalizedOptions } from 'redoc';
import slugify from 'slugify';
import { Link } from 'react-router-dom'
import SelectApi from '../SelectApi/SelectApi';


function prepareSpec(json) {
  const serverEnv = window._env_.SERVER_ENV;
  if(serverEnv && serverEnv !== '' && json && json.servers && Array.isArray(json.servers)) {
    const regex = new RegExp(serverEnv)
    json.servers = json.servers.filter(server => regex.test(server.url))
  }
  return json;
}

class RedocPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      availableApis: window._env_.URLS.map(item => ({ value: slugify(item.name).toLowerCase(), label: item.name, url: item.url })),
      activeApi: {
        url: ''
      },
      options: {
        nativeScrollbars: true,
        scrollYOffset: 60,
        theme: {
          colors: {
            primary: {
              main: window._env_.THEME_COLOR,
            },
          },
        },
      },
      specIsLoaded: false,
      spec: undefined,
    }

    const activeApiFromQuery = this.state.availableApis.find(element => element.value === this.props.match.params.api);

    if (activeApiFromQuery) {
      this.state.activeApi = activeApiFromQuery
    } else {
      this.props.history.push('/');
    }
  }

  componentDidMount() {
    this.update();
  }

  update(state = this.state) {
    window.fetch(state.activeApi.url)
      .then((res) => {
        return res.json();
      })
      .then((json) => {
        const spec = prepareSpec(json);
        this.setState({
          spec,
          specIsLoaded: true,
        })
      }).catch((err) => {
      console.log(err);
      this.setState({
        specIsLoaded: true,
      })
    })
  }

  handleChange = selectedApi => {
    this.setState({
      specIsLoaded: false,
      activeApi: selectedApi
    })

    this.update({...this.state, activeApi: selectedApi})

    this.props.history.push(selectedApi.value);
  };

  loading() {
    // copied from redoc
    const normalizedOpts = new RedocNormalizedOptions(this.state.options);
    return <Loading color={normalizedOpts.theme.colors.primary.main} />;
  }

  render() {
    return (
      <div>
        <header className="RedocPage-header">
          <Link to={'/'}>
            <img src={Logo} alt="Redoc" />
          </Link>

          <SelectApi
            className="select"
            value={this.state.activeApi}
            onChange={this.handleChange}
          />
        </header>
        <section className="container__redoc">
          {this.state.specIsLoaded ?
            (this.state.spec ?
                <RedocStandalone spec={this.state.spec} options={this.state.options} /> :
                <RedocStandalone specUrl={this.state.activeApi.url} options={this.state.options} />
            ) :
            this.loading()
          }
        </section>
      </div>
    );
  }
}

export default RedocPage;
