import Users from "../requests/users.request.js";
import Login from "../requests/login.request.js";
import Products from "../requests/products.request.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";
import {group} from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 5 }, // simulate ramp-up of traffic from 1 to 20 users over 10 seconds.
    { duration: '1m', target: 10 }, // stay at 100 users for 10 minutes
    { duration: '30s', target: 0 }, // ramp-down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(99)<1500'], // 99% of requests must complete below 1.5s
    'group_duration{group:::List valid users}': ['p(95)<=1500'], // will always pass
    'group_duration{group:::Access with admin user}':['p(95)<=5000'], // an actual threshold
    'group_duration{group:::List products}':['p(95)<=5000'],
    'group_duration{group:::Add product}':['p(95)<=5000'],
    'group_duration{group:::Delete product}':['p(95)<=5000'],
  },
};

export default function () {
  let user = new Users();
  let login = new Login();
  let products = new Products();
  group('List valid users', () => {
    user.list();
  });
  group('Access with admin user', () => {
    login.access();
  })
  group('List products', () => {
    products.list();
  });
  group('Add product', () => {
    products.add(login.getToken());
  });
  group('Delete product', () => {
    products.delete(login.getToken())
  })

}

export function handleSummary(data) {
  return {
    "summary.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}