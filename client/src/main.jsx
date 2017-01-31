const React = require('react');
const ReactDom = require('react-dom');

const Component = React.createClass({
  render: function() {
    return <div>This is a test</div>;
  }
});

ReactDom.render(<Component/>, document.getElementById('content'));
