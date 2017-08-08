import React, { Component } from "react";
import PropTypes from "prop-types";
import { sortBy } from "lodash";
import classnames from "classnames";
import "./App.css";

// Set Default Variable for API
const DEFAULT_QUERY = "redux";
const DEFAULT_PAGE = 0;
const DEFAULT_HPP = "100";

// Set Path information for API
const PATH_BASE = "https://hn.algolia.com/api/v1";
const PATH_SEARCH = "/search";
const PARAM_SEARCH = "query=";
const PARAM_PAGE = "page=";
const PARAM_HPP = "hitsPerPage=";

// Helper function for filtering(Client-Side).
const isSearched = searchTerm => item =>
  !searchTerm || item.title.toLowerCase().includes(searchTerm.toLowerCase());

const SORTS = {
  NONE: list => list,
  TITLE: list => sortBy(list, "title"),
  AUTHOR: list => sortBy(list, "author"),
  COMMENTS: list => sortBy(list, "num_comments").reverse(),
  POINTS: list => sortBy(list, "points").reverse()
};

const updateSearchTopstoriesState = (hits, page) => prevState => {
  const { searchKey, results } = prevState;

  const oldHits = results && results[searchKey] ? results[searchKey].hits : [];
  const updatedHits = [...oldHits, ...hits];
  return {
    results: {
      ...results,
      [searchKey]: { hits: updatedHits, page }
    },
    isLoading: false
  };
};

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      results: null,
      searchKey: "",
      searchTerm: DEFAULT_QUERY,
      isLoading: false
    };

    this.needsToSearchTopStories = this.needsToSearchTopStories.bind(this);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.onDismiss = this.onDismiss.bind(this);
    this.onSearchSubmit = this.onSearchSubmit.bind(this);
    this.setSearchTopStories = this.setSearchTopStories.bind(this);
    this.fetchSearchTopStories = this.fetchSearchTopStories.bind(this);
  }

  /**
   * Delete the article
   * @param {string} searchTerm - User's input value
   */
  needsToSearchTopStories(searchTerm) {
    return !this.state.results[searchTerm];
  }

  /**
   * Fetching data from API
   * @param {Object[]} result - Array of result Object
   * @param {number} page - page number to show
   */
  //Helper method to asign the value(from API) to the state.
  setSearchTopStories(result) {
    const { hits, page } = result;
    this.setState(updateSearchTopstoriesState(hits, page));
  }

  /**
 * Fetching data from API
 * @param {string} searchTerm - user's input for search
 * @param {number} page - page number to show
 */
  fetchSearchTopStories(searchTerm, page) {
    this.setState({ isLoading: true });
    fetch(
      `${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PARAM_PAGE}${page}&${PARAM_HPP}${DEFAULT_HPP}`
    )
      .then(response => response.json())
      .then(result => this.setSearchTopStories(result))
      .catch(e => e);
  }

  onSearchChange(event) {
    this.setState({ searchTerm: event.target.value });
  }

  /**
   * Delete the article
   * @param {string} id - Each article's unique ID
   */
  onDismiss(id) {
    const { searchKey, results } = this.state;
    const { hits, page } = results[searchKey];

    const isNotId = item => item.objectID !== id;
    const updatedHits = hits.filter(isNotId);
    this.setState({
      result: {
        ...results,
        [searchKey]: { hits: updatedHits, page }
      }
    });
  }

  onSearchSubmit(e) {
    const { searchTerm } = this.state;
    this.setState({ searchKey: searchTerm });

    if (this.needsToSearchTopStories(searchTerm)) {
      this.fetchSearchTopStories(searchTerm, DEFAULT_PAGE);
    }
    e.preventDefault();
  }

  componentDidMount() {
    const { searchTerm } = this.state;
    this.setState({ searchKey: searchTerm });
    this.fetchSearchTopStories(searchTerm, DEFAULT_PAGE);
  }

  render() {
    const { searchTerm, results, searchKey, isLoading } = this.state;
    const page =
      (results && results[searchKey] && results[searchKey].page) || 0;
    const list =
      (results && results[searchKey] && results[searchKey].hits) || [];

    return (
      <div className="page">
        <div className="interactions">
          <Search
            value={searchTerm}
            onChange={this.onSearchChange}
            onSearchSubmit={this.onSearchSubmit}
          >
            Search
          </Search>
        </div>
        <TableWithLoading list={list} onDismiss={this.onDismiss} />
        <div className="interactions">
          <ButtonWithLoading
            isLoading={isLoading}
            onClick={() => this.fetchSearchTopStories(searchKey, page + 1)}
          >
            More
          </ButtonWithLoading>
        </div>
      </div>
    );
  }
}

class Search extends Component {
  componentDidMount() {
    this.input.focus();
  }

  render() {
    const { value, onChange, children, onSearchSubmit } = this.props;
    return (
      <form onSubmit={onSearchSubmit}>
        {children}{" "}
        <input
          type="text"
          value={value}
          onChange={onChange}
          ref={node => {
            this.input = node;
          }}
        />
        <button type="submit">{children}</button>
      </form>
    );
  }
}
Search.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  children: PropTypes.node,
  onSearchSubmit: PropTypes.func
};

class Table extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sortKey: "NONE",
      isSortReverse: false
    };

    this.onSort = this.onSort.bind(this);
  }

  onSort(sortKey) {
    const isSortReverse =
      this.state.sortKey === sortKey && !this.state.isSortReverse;
    this.setState({ sortKey, isSortReverse });
  }

  render() {
    const { sortKey, isSortReverse } = this.state;
    const { list, onDismiss } = this.props;
    const sortedList = SORTS[sortKey](list);
    const reverseSortedList = isSortReverse ? sortedList.reverse() : sortedList;
    return (
      <div className="table">
        <div className="table-header">
          <span style={{ width: "40%" }}>
            <Sort
              sortKey={"TITLE"}
              onSort={this.onSort}
              activeSortKey={sortKey}
            >
              Title <i className="fa fa-sort" />
            </Sort>
          </span>
          <span style={{ width: "30%" }}>
            <Sort
              sortKey={"AUTHOR"}
              onSort={this.onSort}
              activeSortKey={sortKey}
            >
              Author <i className="fa fa-sort" />
            </Sort>
          </span>
          <span style={{ width: "10%" }}>
            <Sort
              sortKey={"COMMENTS"}
              onSort={this.onSort}
              activeSortKey={sortKey}
            >
              {" "}Comments <i className="fa fa-sort" />
            </Sort>
          </span>
          <span style={{ width: "10%" }}>
            <Sort
              sortKey={"POINTS"}
              onSort={this.onSort}
              activeSortKey={sortKey}
            >
              Points <i className="fa fa-sort" />
            </Sort>
          </span>
          <span style={{ width: "10%" }}>Archive</span>
        </div>
        {reverseSortedList.map(item =>
          <div key={item.objectID} className="table-row">
            <span style={{ width: "40%" }}>
              <a href={item.url}>
                {item.title}
              </a>
            </span>
            <span style={{ width: "30%" }}>
              {item.author}
            </span>
            <span style={{ width: "10%" }}>
              {item.num_comments}
            </span>
            <span style={{ width: "10%" }}>
              {item.points}
            </span>
            <span style={{ width: "10%" }}>
              <Button
                onClick={() => onDismiss(item.objectID)}
                className="button-inline"
              >
                Dismiss
              </Button>
            </span>
          </div>
        )}
      </div>
    );
  }
}

Table.propTypes = {
  list: PropTypes.arrayOf(
    PropTypes.shape({
      objectID: PropTypes.string.isRequired,
      author: PropTypes.string,
      url: PropTypes.string,
      num_comments: PropTypes.number,
      points: PropTypes.number
    })
  ).isRequired,
  onDismiss: PropTypes.func.isRequired
};

const Button = ({ onClick, className, children }) => {
  return (
    <button onClick={onClick} className={className} type="button">
      {children}
    </button>
  );
};

Button.propTypes = {
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string,
  children: PropTypes.node.isRequired
};

Button.defaultProps = {
  className: ""
};

const Sort = ({ sortKey, onSort, children, activeSortKey }) => {
  const sortClass = classnames("button-inline", {
    "button-active": sortKey === activeSortKey
  });

  return (
    <Button onClick={() => onSort(sortKey)} className={sortClass}>
      {children}
    </Button>
  );
};

const Loading = () =>
  <div>
    <i className="fa fa-refresh fa-spin fa-fw fa-loading" />
  </div>;

const withLoading = Component => ({ isLoading, ...rest }) =>
  isLoading ? <Loading /> : <Component {...rest} />;
// const withLoading = component => ({ isLoading, ...rest }) =>
//   isLoading ? <Loading /> : <Component {...rest} />;

const ButtonWithLoading = withLoading(Button);
const TableWithLoading = withLoading(Table);

export default App;

export { Button, Search, Table };
