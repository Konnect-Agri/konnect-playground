import React, { Component ,useState} from "react";
import MonacoEditor from "@monaco-editor/react";
import "react-app-polyfill/ie11";
import Form, { withTheme } from "@rjsf/core";
import { shouldRender } from "@rjsf/utils";
import DemoFrame from "./DemoFrame";
import localValidator from "@rjsf/validator-ajv6";
import Axios from 'axios';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Alert from '@mui/material/Alert';
import { Container } from "@mui/system";
import ResponsiveAppBar from "./DemoCounter"

const log = (type) => console.log.bind(console, type);
const toJson = (val) => {
  console.log("val is toJSON: ", val);
  return JSON.stringify(val, null, 2);
}

const toGQL = (val) => {
  const fields = [] ;
  let query = "query MyQuery {\n  attendance {\n" ;
  for(let field in val) {
    if(val[field]) {
      fields.push(field)
      query = query + `    ${field}\n` ; 
    } 
  }

  console.log(fields);

  query = query + `  }\n}`;

  return query 
}

const consentSamples = {
  consentSchema: {
    title: "Farmer Consent",
    type: "object",
    properties: {
      id: {
        type: "boolean"
      },
      date: {
        type: "boolean",
      },
      created_at: {
        type: "boolean",
      },
      absence_reason: {
        type: "boolean",
      }
    }
  },
  consentuiSchema: {
    classNames: "custom-css-class",
  },
  consentFormData: {
    id: false,
    date: false,
    absence_reason: false,
    created_at: false,
  }
};

const querySamples = {
  querySchema: {
    title: "Bank Request",
    type: "object",
    properties: {
      id: {
        type: "boolean"
      },
      date: {
        type: "boolean",
      },
      created_at: {
        type: "boolean",
      },
      absence_reason: {
        type: "boolean",
      }
    }
  },
  queryuiSchema: {
    classNames: "custom-css-class",
  },
  queryFormData: {
    id: false,
    date: false,
    absence_reason: false,
    created_at: false,
  }
};

const liveSettingsSchema = {
  type: "object",
  properties: {
    validate: { type: "boolean", title: "Live validation" },
    disable: { type: "boolean", title: "Disable whole form" },
    readonly: { type: "boolean", title: "Readonly whole form" },
    omitExtraData: { type: "boolean", title: "Omit extra data" },
    liveOmit: { type: "boolean", title: "Live omit" },
    noValidate: { type: "boolean", title: "Disable validation" },
  },
};

const monacoEditorOptions = {
  minimap: {
    enabled: false,
  },
  automaticLayout: true,
};

class GeoPosition extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      ...props.formData,
      query: "",
      superyQuery: "",
    };
  }

  onChange(name) {
    return (event) => {
      this.setState({ [name]: parseFloat(event.target.value) });
      setTimeout(() => this.props.onChange(this.state), 0);
    };
  }

  render() {
    const { lat, lon } = this.state;
    return (
      <div className="geo">
        <h3>Hey, I'm a custom component</h3>
        <p>
          I'm registered as <code>geo</code> and referenced in
          <code>uiSchema</code> as the <code>ui:field</code> to use for this
          schema.
        </p>
        <div className="row">
          <div className="col-sm-6">
            <label>Latitude</label>
            <input
              className="form-control"
              type="number"
              value={lat}
              step="0.00001"
              onChange={this.onChange("lat")}
            />
          </div>
          <div className="col-sm-6">
            <label>Longitude</label>
            <input
              className="form-control"
              type="number"
              value={lon}
              step="0.00001"
              onChange={this.onChange("lon")}
            />
          </div>
        </div>
      </div>
    );
  }
}

class Editor extends Component {
  constructor(props) {
    super(props);
    // console.log("props: ", props);
    this.state = { valid: true, code: props.code, lang: props.lang };
  }

  UNSAFE_componentWillReceiveProps(props) {
    this.setState({ valid: true, code: props.code });
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.state.valid) {
      return (
        JSON.stringify(JSON.parse(nextProps.code)) !==
        JSON.stringify(JSON.parse(this.state.code))
      );
    }
    return false;
  }

  onCodeChange = (code) => {
    try {
      const parsedCode = JSON.parse(code);
      this.setState({ valid: true, code }, () =>
        this.props.onChange(parsedCode)
      );
    } catch (err) {
      this.setState({ valid: false, code });
    }
  };

  render() {
    const { title } = this.props;
    const icon = this.state.valid ? "ok" : "remove";
    const cls = this.state.valid ? "valid" : "invalid";
    return (
      <div className="panel panel-default">
        <div className="panel-heading">
          <span className={`${cls} glyphicon glyphicon-${icon}`} />
          {" " + title}
        </div>
        <MonacoEditor
          language= {this.state.lang}
          value={this.state.code}
          theme="vs-light"
          onChange={this.onCodeChange}
          height={400}
          options={monacoEditorOptions}
        />
      </div>
    );
  }
}

class Selector extends Component {
  constructor(props) {
    super(props);
    this.state = { current: "Simple" };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shouldRender(this, nextProps, nextState);
  }

  onLabelClick = (label) => {
    return (event) => {
      event.preventDefault();
      this.setState({ current: label });
      setTimeout(() => this.props.onSelected(consentSamples[label]), 0);
    };
  };

  onQueryLabelClick = (label) => {
    return (event) => {
      event.preventDefault();
      this.setState({ current: label });
      setTimeout(() => this.props.onSelected(querySamples[label]), 0);
    };
  };

  render() {
    return (
      <ul className="nav nav-pills">
        {Object.keys(consentSamples).map((label, i) => {
          return (
            <li
              key={i}
              role="presentation"
              className={this.state.current === label ? "active" : ""}
            >
              <a href="#" onClick={this.onLabelClick(label)}>
                {label}
              </a>
            </li>
          );
        })}
      </ul>
    );
  }
}

function ThemeSelector({ theme, themes, select }) {
  const schema = {
    type: "string",
    enum: Object.keys(themes),
  };
  const uiSchema = {
    "ui:placeholder": "Select theme",
  };
  return (
    <Form
      className="form_rjsf_themeSelector"
      idPrefix="rjsf_themeSelector"
      schema={schema}
      uiSchema={uiSchema}
      formData={theme}
      validator={localValidator}
      onChange={({ formData }) =>
        formData && select(formData, themes[formData])
      }
    >
      <div />
    </Form>
  );
}

function SubthemeSelector({ subtheme, subthemes, select }) {
  const schema = {
    type: "string",
    enum: Object.keys(subthemes),
  };
  const uiSchema = {
    "ui:placeholder": "Select subtheme",
  };
  return (
    <Form
      className="form_rjsf_subthemeSelector"
      idPrefix="rjsf_subthemeSelector"
      schema={schema}
      uiSchema={uiSchema}
      formData={subtheme}
      validator={localValidator}
      onChange={({ formData }) =>
        formData && select(formData, subthemes[formData])
      }
    >
      <div />
    </Form>
  );
}

function ValidatorSelector({ validator, validators, select }) {
  const schema = {
    type: "string",
    enum: Object.keys(validators),
  };
  const uiSchema = {
    "ui:placeholder": "Select validator",
  };
  return (
    <Form
      className="form_rjsf_validatorSelector"
      idPrefix="rjsf_validatorSelector"
      schema={schema}
      uiSchema={uiSchema}
      formData={validator}
      validator={localValidator}
      onChange={({ formData }) => formData && select(formData)}
    >
      <div />
    </Form>
  );
}

class CopyLink extends Component {
  onCopyClick = (event) => {
    this.input.select();
    document.execCommand("copy");
  };

  render() {
    const { shareURL, onShare } = this.props;
    if (!shareURL) {
      return (
        <button className="btn btn-default" type="button" onClick={onShare}>
          Share
        </button>
      );
    }
    return (
      <div className="input-group">
        <input
          type="text"
          ref={(input) => (this.input = input)}
          className="form-control"
          defaultValue={shareURL}
        />
        <span className="input-group-btn">
          <button
            className="btn btn-default"
            type="button"
            onClick={this.onCopyClick}
          >
            <i className="glyphicon glyphicon-copy" />
          </button>
        </span>
      </div>
    );
  }
}

class Playground extends Component {
  constructor(props) {
    super(props);

    // set default theme
    const theme = "default";
    const validator = "AJV6";
    const { consentSchema, consentuiSchema, consentFormData, validate } = consentSamples;
    const { querySchema, queryuiSchema, queryFormData} = querySamples;
    
    this.playGroundForm = React.createRef();
    this.queryForm = React.createRef();
    this.state = {
      form: false,
      consentSchema,
      querySchema,
      consentuiSchema,
      queryuiSchema,
      consentFormData,
      queryFormData,
      validate,
      theme,
      validator,
      subtheme: null,
      liveSettings: {
        validate: false,
        disable: false,
        readonly: false,
        omitExtraData: false,
        liveOmit: false,
      },
      shareURL: "",
      FormComponent: withTheme({}),
      query: "",
      superQuery: "",
      result: {},
      message:"Please check the desired attributes",
      error:0,
      count:0
    };
  }

  componentDidMount() {
    const { themes } = this.props;
    const { theme } = this.state;
    const hash = document.location.hash.match(/#(.*)/);
    if (hash && typeof hash[1] === "string" && hash[1].length > 0) {
      try {
        this.load(JSON.parse(atob(hash[1])));
      } catch (err) {
        alert("Unable to load form setup data.");
      }
    } else {
      // initialize theme
      this.onThemeSelected(theme, themes[theme]);

      this.setState({ form: true });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shouldRender(this, nextProps, nextState);
  }

  load = (data) => {
    // Reset the ArrayFieldTemplate whenever you load new data
    const { ArrayFieldTemplate, ObjectFieldTemplate, extraErrors } = data;
    // uiSchema is missing on some examples. Provide a default to
    // clear the field in all cases.
    const { uiSchema = {} } = data;

    const { theme = this.state.theme } = data;
    const { themes } = this.props;
    this.onThemeSelected(theme, themes[theme]);

    // force resetting form component instance
    this.setState({ form: false }, () =>
      this.setState({
        ...data,
        form: true,
        ArrayFieldTemplate,
        ObjectFieldTemplate,
        uiSchema,
        extraErrors,
      })
    );
  };

  onSchemaEdited = (schema) => this.setState({ schema, shareURL: null });

  onUISchemaEdited = (uiSchema) => this.setState({ uiSchema, shareURL: null });

  onFormDataEdited = (formData) => { 
    console.log("formData: ", formData);
    this.setState({ formData, shareURL: null }) 
  };

  onExtraErrorsEdited = (extraErrors) =>
    this.setState({ extraErrors, shareURL: null });

  onThemeSelected = (
    theme,
    { subthemes, stylesheet, theme: themeObj } = {}
  ) => {
    this.setState({
      theme,
      subthemes,
      subtheme: null,
      FormComponent: withTheme(themeObj),
      stylesheet,
    });
  };

  onSubthemeSelected = (subtheme, { stylesheet }) => {
    this.setState({
      subtheme,
      stylesheet,
    });
  };

  onValidatorSelected = (validator) => {
    this.setState({ validator });
  };

  setLiveSettings = ({ formData }) => this.setState({ liveSettings: formData });

  onFormDataChange = ({ consentFormData = "" }) =>
    this.setState({ consentFormData, shareURL: null });

  onQueryFormDataChange = ({ queryFormData = "" }) =>
    this.setState({ queryFormData, shareURL: null });

  onShare = () => {
    const { formData, schema, uiSchema, liveSettings, errorSchema, theme } = this.state;
    const {
      location: { origin, pathname },
    } = document;
    try {
      const hash = btoa(
        JSON.stringify({
          formData,
          schema,
          uiSchema,
          theme,
          liveSettings,
          errorSchema,
        })
      );
      this.setState({ shareURL: `${origin}${pathname}#${hash}` });
    } catch (err) {
      
      this.setState({ shareURL: null });
    }
  };
  
  render() {
    const {
      consentSchema,
      consentuiSchema,
      consentFormData,
      querySchema,
      queryuiSchema,
      queryFormData,
      extraErrors,
      liveSettings,
      validate,
      theme,
      validator,
      subtheme,
      FormComponent,
      ArrayFieldTemplate,
      ObjectFieldTemplate,
      transformErrors,
      shareURL,
    } = this.state;

    const { themes, validators } = this.props;

    let templateProps = {};
    if (ArrayFieldTemplate) {
      templateProps.ArrayFieldTemplate = ArrayFieldTemplate;
    }
    if (ObjectFieldTemplate) {
      templateProps.ObjectFieldTemplate = ObjectFieldTemplate;
    }
    if (extraErrors) {
      templateProps.extraErrors = extraErrors;
    }

    return (
        <Container>
        <Row>
          <Col>
          <div className="page-header row">
             <h1>Consent Artifact Field Selector</h1>
          </div>
          </Col>
        </Row>
        <Row style={{marginBottom:"20px", width:"20%"}}>
          <Alert style={{width:"100%", fontSize:"20px"}} severity="info">Count of Query: {this.state.count}</Alert>
        </Row>
        <Row style={{marginBottom:"20px"}}>
          {this.state.error === 200? <Alert style={{width:"100%", fontSize:"20px"}} severity="success">{this.state.message}</Alert> :<Alert style={{width:"100%", fontSize:"20px"}} severity="error">{this.state.message}</Alert>}
        {/* {shareURL == null ? <Alert style={{width:"100%", fontSize:"20px"}} severity="info">This is an error alert — check it out!</Alert>: <Alert style={{width:"100%", fontSize:"20px"}} severity="success">This is an info alert — check it out!</Alert>} */}
        </Row>
        <Row style={{height:"500px"}}>
          <Col md={4}>
          <div className="col">
          {this.state.form && (
            <DemoFrame
              head={
                <React.Fragment>
                  <link
                    rel="stylesheet"
                    id="theme"
                    href={this.state.stylesheet || ""}
                  />
                  {theme === "antd" && (
                    <div
                      dangerouslySetInnerHTML={{
                        __html:
                          document.getElementById("antd-styles-iframe")
                            .contentDocument.head.innerHTML,
                      }}
                    />
                  )}
                </React.Fragment>
              }
              style={{
                width: "100%",
                height: "400px",
                border: 0,
              }}
              theme={theme}
            >
              <FormComponent
                {...templateProps}
                liveValidate={liveSettings.validate}
                disabled={liveSettings.disable}
                readonly={liveSettings.readonly}
                omitExtraData={liveSettings.omitExtraData}
                liveOmit={liveSettings.liveOmit}
                noValidate={liveSettings.noValidate}
                schema={querySchema}
                uiSchema={queryuiSchema}
                formData={queryFormData}
                onChange={this.onQueryFormDataChange}
                noHtml5Validate={true}
                onSubmit={({ formData }, e) => {
                  e.preventDefault();
                  // console.log("submitted formData", formData);
                  const query = toGQL(formData);
                  // console.log("submitted gqlQuery", query);
                  // console.log("submit event", e);
                  navigator.clipboard.writeText(query); 
                  this.setState({...this.state, queryFormData: formData, query: toGQL(formData)}); 
                  // console.log("states: ", this.state);
                  window.alert("Bank Query Saved");
                }}
                fields={{ geo: GeoPosition }}
                customValidate={validate}
                validator={validators[validator]}
                onBlur={(id, value) =>
                  console.log(`Touched ${id} with value ${value}`)
                }
                onFocus={(id, value) =>
                  console.log(`Focused ${id} with value ${value}`)
                }
                transformErrors={transformErrors}
                onError={log("errors")}
                ref={this.queryForm}
              /> 
            </DemoFrame>
          )}
          </div>
          </Col>
          <Col md={4}>
          <div className="col">
       {this.state.form && (
            <DemoFrame
              head={
                <React.Fragment>
                  <link
                    rel="stylesheet"
                    id="theme"
                    href={this.state.stylesheet || ""}
                  />
                  {theme === "antd" && (
                    <div
                      dangerouslySetInnerHTML={{
                        __html:
                          document.getElementById("antd-styles-iframe")
                            .contentDocument.head.innerHTML,
                      }}
                    />
                  )}
                </React.Fragment>
              }
              style={{
                width: "100%",
                height: 1000,
                border: 0,
              }}
              theme={theme}
            >
              <FormComponent
                {...templateProps}
                liveValidate={liveSettings.validate}
                disabled={liveSettings.disable}
                readonly={liveSettings.readonly}
                omitExtraData={liveSettings.omitExtraData}
                liveOmit={liveSettings.liveOmit}
                noValidate={liveSettings.noValidate}
                schema={consentSchema}
                uiSchema={consentuiSchema}
                formData={consentFormData}
                onChange={this.onFormDataChange}
                noHtml5Validate={true}
                onSubmit={({ formData }, e) => {
                  e.preventDefault();
                  // console.log("submitted formData", consentFormData);
                  const superQuery = toGQL(formData);
                  // console.log("submitted gqlSuperQuery", superQuery);
                  // console.log("submit event", e);
                  navigator.clipboard.writeText(superQuery);
                  this.setState({...this.state, consentFormData: formData, superQuery: toGQL(formData)});   
                  console.log("states: ", this.state);
                  window.alert("Query copied to clipboard");
                }}
                fields={{ geo: GeoPosition }}
                customValidate={validate}
                validator={validators[validator]}
                onBlur={(id, value) =>
                  console.log(`Touched ${id} with value ${value}`)
                }
                on Focus={(id, value) =>
                  console.log(`Focused ${id} with value ${value}`)
                }
                transformErrors={transformErrors}
                onError={log("errors")}
                ref={this.playGroundForm}
              />
              <div className="row">
            <div className="col-sm-6">
              <button style={{marginTop:"10px"}} className="btn" onClick={(e) => {
                console.log('query in run: ', this.state.query);
                console.log('super query in run: ', this.state.superQuery)
                Axios({
                  method: 'POST',
                  url: 'https://gatekeeper-production-75c4.up.railway.app/req-checker',
                  data: {
                    consentArtifact: {
                      "created": "YYYY-MM-DDThh:mm:ssZn.n",
                      "expires": "YYYY-MM-DDThh:mm:ssZn.n",
                      "id": "",
                      "revocable": false,
                      "collector": {
                          "id": "",
                          "url": "https://sample-collector/api/v1/collect"
                      },
                      "consumer": {
                          "id": "",
                          "url": "https://sample-consumer/api/v1/consume"
                      },
                      "provider": {
                          "id": "",
                          "url": "https://sample-consumer/api/v1"
                      },
                      "user": {
                          "type": "AADHAAR|MOBILE|PAN|PASSPORT|...",
                          "name": "",
                          "issuer": "",
                          "dpID": "",
                          "cmID": "",
                          "dcID": ""
                      },
                      "revoker": {
                          "url": "https://sample-revoker/api/v1/revoke",
                          "name": "",
                          "id": ""
                      },
                      "purpose": "",
                      "user_sign": "",
                      "collector_sign": "",
                      "log": {
                          "consent_use": {
                              "url": "https://sample-log/api/v1/log"
                          },
                          "data_access": {
                              "url": "https://sample-log/api/v1/log"
                          }
                      },
                      "data": this.state.superQuery,
                      },
                      gql: this.state.query
                  }
                }).then((res) => {
                  var d = new Date();
                  var n = d.toLocaleTimeString();
                  this.setState({count: this.state.count+1});
                  this.setState({message: n+" Requested data for farmer with aadhar number xxxxxxxxxxx"});
                    this.setState({error: 200});
                  console.log(res.data)
                  this.setState({result: res.data})
                }).catch((err) => {
                  var d = new Date();
                  var n = d.toLocaleTimeString();
                  this.setState({count: this.state.count+1});
                  if(err.response.status === 429)
                  {

                    this.setState({message: n+" Too many requests!"});
                      this.setState({error: 429});
                      console.log(n);

                  }
                  else if(err.response.status === 403)
                  {
                      this.setState({message: n+" You dont have access to the requested attributes"});
                      this.setState({error: 403});
                  }
                  console.log('err: ', err.data);  
                  this.setState({
                    result: {
                      code: err.code,
                      name: err.name,
                      message: err.message
                    }
                  })                
                });
              }}> Run Query </button>
            </div>
          </div>
          <div className="row">
          </div>
            </DemoFrame>
          )}
          </div>
          </Col>
          <Col md={4}>
          <Editor
                lang="json"
                title="result"
                code={toJson(this.state.result)}
                onChange={this.onFormDataEdited}
              />
          </Col>
        </Row>
      </Container>
    );
  }
}

export default Playground;
