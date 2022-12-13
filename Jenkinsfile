pipeline {
    agent any
    parameters {
        choice(
            name: 'SCRIPTNAME',
            choices: ['FullFlowLoad', 'Script2', 'Sanity'],
            description: ''
        )
    }
    stages{

        stage('Pull Code from GitHub') {
            steps{
                git credentialsId: 'githubcred', url: 'https://github.com/srivishal1/k6test.git'
            }
            }
            
            stage('RUN K6 Docker Image') {
            steps {
              sh("docker pull grafana/k6")
            }
        }
        
         stage('Run Performance Test') {
            steps {
                sh("docker run --rm -i grafana/k6 run - <$workspace/src/simulations/${SCRIPTNAME}.test.js --out influxdb=http://65.1.86.21:8086/k6")
                }
            }
            
            
        }
        post {
        always {  
            publishHTML target: [
                reportName: 'Test',
                reportFiles: 'summary.html', 
                reportTitles: 'K6 Load Test Report', 
                keepAll: true,
                alwaysLinkToLastBuild: true,
                allowMissing: false
            ]  
        }
    }

           
}
